import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertPostSchema, insertImageSchema, insertVersionSchema } from "@shared/schema"; // Added import
import multer from "multer";
import path from "path";
import express from 'express';
import { requireAuth, AuthenticatedRequest, isAdmin } from './middleware/auth';
import session from 'express-session';

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
      return cb(new Error('Only image files are allowed!'));
    }
    if (file.mimetype.startsWith('image/') || file.mimetype === 'image/svg+xml') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export async function registerRoutes(app: Express) {
  // Session setup
  app.use(session({
    store: storage.sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key', // In production, always use environment variable
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax' // Protect against CSRF
    }
  }));

  // Static file serving - removed because we are no longer using disk storage
  //app.use('/uploads', express.static('uploads'));

  // Auth Routes
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await storage.validateCredentials(username, password);

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // @ts-ignore - adding user to session
    req.session.user = user;
    res.json(user);
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
      res.sendStatus(200);
    });
  });

  app.get('/api/auth/status', (req, res) => {
    // @ts-ignore - checking user in session
    if (!req.session.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    // @ts-ignore - sending user from session
    res.json(req.session.user);
  });


  // Public routes
  app.get("/api/posts", async (req, res) => {
    const { search, tag, published } = req.query;
    let posts = await storage.getPosts();

    if (published === "true") {
      posts = posts.filter(post => !post.isDraft);
    }

    if (search && typeof search === "string") {
      posts = await storage.searchPosts(search);
      if (published === "true") {
        posts = posts.filter(post => !post.isDraft);
      }
    }

    if (tag && typeof tag === "string") {
      posts = await storage.getPostsByTag(tag);
      if (published === "true") {
        posts = posts.filter(post => !post.isDraft);
      }
    }

    res.json(posts);
  });

  app.get("/api/posts/:id", async (req, res) => {
    const post = await storage.getPost(Number(req.params.id));
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    res.json(post);
  });

  // Protected admin routes
  app.post("/api/posts", requireAuth, async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const result = insertPostSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: result.error.message });
      return;
    }
    const post = await storage.createPost(result.data);
    res.status(201).json(post);
  });

  app.patch("/api/posts/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const result = insertPostSchema.partial().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: result.error.message });
      return;
    }
    try {
      const post = await storage.updatePost(Number(req.params.id), result.data);
      res.json(post);
    } catch (error) {
      res.status(404).json({ message: "Post not found" });
    }
  });

  app.delete("/api/posts/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await storage.deletePost(Number(req.params.id));
    res.status(204).send();
  });

  // Add the publish endpoint after other post endpoints
  app.post("/api/posts/:id/publish", requireAuth, async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    try {
      const post = await storage.publishPost(Number(req.params.id));
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to publish post" });
    }
  });

  // Add version routes after post routes
  app.post("/api/posts/:id/versions", requireAuth, async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    try {
      const result = insertVersionSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: result.error.message });
        return;
      }

      const version = await storage.saveVersion(Number(req.params.id), {
        ...result.data,
        createdBy: req.user.id, // Add the current user's ID
      });
      res.json(version);
    } catch (error) {
      console.error('Failed to save version:', error);
      res.status(500).json({ message: "Failed to save version" });
    }
  });

  app.get("/api/posts/:id/versions", requireAuth, async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    try {
      const versions = await storage.getVersions(Number(req.params.id));
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch versions" });
    }
  });

  app.get("/api/versions/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    try {
      const version = await storage.getVersion(Number(req.params.id));
      if (!version) {
        res.status(404).json({ message: "Version not found" });
        return;
      }
      res.json(version);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch version" });
    }
  });

  // Add these comment-related routes after the post routes
  // Public routes for submitting and viewing comments
  app.post("/api/posts/:id/comments", async (req, res) => {
    const result = insertCommentSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: result.error.message });
      return;
    }

    try {
      const comment = await storage.createComment({
        ...result.data,
        postId: Number(req.params.id),
      });
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to save comment" });
    }
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getApprovedComments(Number(req.params.id));
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Protected admin routes for managing comments
  app.get("/api/comments/pending", requireAuth, async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    try {
      const comments = await storage.getPendingComments();
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending comments" });
    }
  });

  app.post("/api/comments/:id/approve", requireAuth, async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    try {
      const comment = await storage.approveComment(Number(req.params.id));
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve comment" });
    }
  });

  app.post("/api/comments/:id/reject", requireAuth, async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    try {
      await storage.deleteComment(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to reject comment" });
    }
  });

  // Increment view count
  app.post("/api/posts/:id/view", async (req, res) => {
    try {
      await storage.incrementViews(Number(req.params.id));
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ message: "Failed to record view" });
    }
  });

  // Record social share
  app.post("/api/posts/:id/share", async (req, res) => {
    try {
      await storage.incrementShareCount(Number(req.params.id));
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ message: "Failed to record share" });
    }
  });


  // Protected image routes
  app.post("/api/images", requireAuth, upload.single('image'), async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No image file provided" });
      return;
    }

    try {
      const imageData = {
        filename: req.file.originalname,
        data: req.file.buffer,
        mimeType: req.file.mimetype,
        size: req.file.size.toString(),
      };

      const image = await storage.createImage(imageData);

      // Convert the binary data to a base64 data URL
      const base64Data = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;

      // Return both the image record and the data URL
      res.status(201).json({
        ...image,
        url: dataUrl
      });
    } catch (error) {
      console.error('Failed to save image:', error);
      res.status(500).json({ message: "Failed to save image" });
    }
  });

  app.delete("/api/images/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    try {
      await storage.deleteImage(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // Auth status endpoint - this line was already present
  // app.get("/api/auth/status", requireAuth, (req: AuthenticatedRequest, res) => {
  //   res.json({
  //     authenticated: true,
  //     user: req.user,
  //     isAdmin: isAdmin(req)
  //   });
  // });

  return createServer(app);
}