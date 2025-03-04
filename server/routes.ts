import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertPostSchema, insertImageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import express from 'express';

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  fileFilter: (_req, file, cb) => {
    // Accept images and SVGs
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
      return cb(new Error('Only image files (jpg, jpeg, png, gif, svg) are allowed!'));
    }
    if (file.mimetype.startsWith('image/') || file.mimetype === 'image/svg+xml') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express) {
  // Ensure uploads directory exists
  app.use('/uploads', express.static('uploads'));

  // Image upload endpoint
  app.post("/api/images", upload.single('image'), async (req, res) => {
    if (!req.file) {
      const error = req.fileValidationError || "No image file provided";
      console.error('Image upload failed:', error);
      res.status(400).json({ message: error });
      return;
    }

    try {
      console.log('Processing uploaded file:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const imageData = {
        filename: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size.toString(),
      };

      const image = await storage.createImage(imageData);
      console.log('Image saved to database:', image);
      res.status(201).json(image);
    } catch (error) {
      console.error('Failed to save image:', error);
      res.status(500).json({ message: "Failed to save image", error: String(error) });
    }
  });

  app.delete("/api/images/:id", async (req, res) => {
    try {
      await storage.deleteImage(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // Existing post routes
  app.get("/api/posts", async (req, res) => {
    const { search, tag, published } = req.query;

    let posts = await storage.getPosts();

    // Filter out drafts for public view
    if (published === "true") {
      posts = posts.filter(post => !post.isDraft);
    }

    // Apply search filter if present
    if (search && typeof search === "string") {
      posts = await storage.searchPosts(search);
      if (published === "true") {
        posts = posts.filter(post => !post.isDraft);
      }
    }

    // Apply tag filter if present
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

  app.post("/api/posts", async (req, res) => {
    const result = insertPostSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: result.error.message });
      return;
    }
    const post = await storage.createPost(result.data);
    res.status(201).json(post);
  });

  app.patch("/api/posts/:id", async (req, res) => {
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

  app.delete("/api/posts/:id", async (req, res) => {
    await storage.deletePost(Number(req.params.id));
    res.status(204).send();
  });

  return createServer(app);
}