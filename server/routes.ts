import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import {
  insertPostSchema,
  insertImageSchema,
  insertVersionSchema,
  insertCommentSchema,
  insertSiteSettingsSchema,
} from "@shared/schema";
import multer from "multer";
import path from "path";
import express from "express";
import { requireAuth, AuthenticatedRequest, isAdmin } from "./middleware/auth";
import session from "express-session";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { Head } from "@/components/blog/Head";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
      return cb(new Error("Only image files are allowed!"));
    }
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "image/svg+xml"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

export async function registerRoutes(app: Express) {
  // Session setup
  app.use(
    session({
      store: storage.sessionStore,
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
    }),
  );

  // Static file serving - removed because we are no longer using disk storage
  //app.use('/uploads', express.static('uploads'));

  // Auth Routes
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await storage.validateCredentials(username, password);

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // @ts-ignore - adding user to session
    req.session.user = user;
    res.json(user);
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.sendStatus(200);
    });
  });

  // Add after other auth routes
  app.post(
    "/api/auth/password",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      if (!isAdmin(req)) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      try {
        const user = await storage.validateCredentials(
          req.user.username,
          currentPassword,
        );
        if (!user) {
          res.status(401).json({ message: "Current password is incorrect" });
          return;
        }

        await storage.updatePassword(req.user.id, newPassword);
        res.json({ message: "Password updated successfully" });
      } catch (error) {
        console.error("Failed to update password:", error);
        res.status(500).json({ message: "Failed to update password" });
      }
    },
  );

  // Add after other auth routes
  app.post(
    "/api/auth/reset-to-default",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      if (!isAdmin(req)) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      try {
        await storage.updatePassword(req.user.id, "bismuth@#!password1234");
        res.json({ message: "Password reset to default successfully" });
      } catch (error) {
        console.error("Failed to reset password:", error);
        res.status(500).json({ message: "Failed to reset password" });
      }
    },
  );

  // Get site settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Failed to get site settings:", error);
      res.status(500).json({ message: "Failed to get site settings" });
    }
  });

  // Update site settings
  app.patch(
    "/api/settings",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      if (!isAdmin(req)) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      try {
        const result = insertSiteSettingsSchema.partial().safeParse(req.body);
        if (!result.success) {
          res.status(400).json({ message: result.error.message });
          return;
        }
        const settings = await storage.updateSiteSettings(result.data);
        res.json(settings);
      } catch (error) {
        console.error("Failed to update site settings:", error);
        res.status(500).json({ message: "Failed to update site settings" });
      }
    },
  );

  // Public routes
  app.get("/api/posts", async (req, res) => {
    const { search, tag, published } = req.query;
    let posts = await storage.getPosts();

    if (published === "true") {
      posts = posts.filter((post) => !post.isDraft);
    }

    if (search && typeof search === "string") {
      posts = await storage.searchPosts(search);
      if (published === "true") {
        posts = posts.filter((post) => !post.isDraft);
      }
    }

    if (tag && typeof tag === "string") {
      posts = await storage.getPostsByTag(tag);
      if (published === "true") {
        posts = posts.filter((post) => !post.isDraft);
      }
    }

    // Sort posts by creation date, newest first
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(posts);
  });

  app.get("/api/posts/by-slug/:slug", async (req, res) => {
    const post = await storage.getPostBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    res.json(post);
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
  app.post(
    "/api/posts",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      if (!isAdmin(req)) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      const result = insertPostSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: result.error.message });
        return;
      }

      // If no slug provided, generate one from title
      if (!result.data.slug) {
        result.data.slug = result.data.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");
      }

      const post = await storage.createPost(result.data);
      res.status(201).json(post);
    },
  );

  app.patch(
    "/api/posts/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      if (!isAdmin(req)) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      const result = insertPostSchema.partial().safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: result.error.message });
        return;
      }

      // If title is being updated but no slug is provided, generate new slug
      if (result.data.title && !result.data.slug) {
        result.data.slug = result.data.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");
      }

      try {
        const post = await storage.updatePost(
          Number(req.params.id),
          result.data,
        );
        res.json(post);
      } catch (error) {
        console.error("Failed to update post:", error);
        res.status(500).json({ message: "Failed to update post" });
      }
    },
  );

  app.delete(
    "/api/posts/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      if (!isAdmin(req)) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      try {
        await storage.deletePost(Number(req.params.id));
        res.status(204).send();
      } catch (error) {
        console.error("Failed to delete post:", error);
        res.status(500).json({ message: "Failed to delete post" });
      }
    },
  );

  // Add the publish endpoint after other post endpoints
  app.post(
    "/api/posts/:id/publish",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

  // Add version routes after post routes
  app.post(
    "/api/posts/:id/versions",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
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
          createdBy: req.user.id,
        });
        res.json(version);
      } catch (error) {
        console.error("Failed to save version:", error);
        res.status(500).json({ message: "Failed to save version" });
      }
    },
  );

  app.get(
    "/api/posts/:id/versions",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

  app.get(
    "/api/versions/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

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
      console.error("Failed to create comment:", error);
      res.status(500).json({ message: "Failed to save comment" });
    }
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        res.status(400).json({ message: "Invalid post ID" });
        return;
      }
      console.log(`Retrieved ${postId} approved comments for post ${postId}`);
      const comments = await storage.getApprovedComments(postId);
      res.json(comments);
    } catch (error) {
      console.error(
        `Failed to get approved comments for post ${req.params.id}:`,
        error,
      );
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Protected admin routes for managing comments
  app.get(
    "/api/comments/pending",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

  app.post(
    "/api/comments/:id/approve",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

  app.post(
    "/api/comments/:id/reject",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

  // Add this endpoint with the other comment endpoints
  app.delete(
    "/api/comments/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      if (!isAdmin(req)) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      try {
        await storage.deleteComment(Number(req.params.id));
        res.status(204).send();
      } catch (error) {
        console.error("Failed to delete comment:", error);
        res.status(500).json({ message: "Failed to delete comment" });
      }
    },
  );

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
  app.post(
    "/api/images",
    requireAuth,
    upload.single("image"),
    async (req: AuthenticatedRequest, res) => {
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
        const base64Data = req.file.buffer.toString("base64");
        const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;

        // Return both the image record and the data URL
        res.status(201).json({
          ...image,
          url: dataUrl,
        });
      } catch (error) {
        console.error("Failed to save image:", error);
        res.status(500).json({ message: "Failed to save image" });
      }
    },
  );

  app.delete(
    "/api/images/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

  // Add this endpoint with other image endpoints
  app.get("/api/images/:id", async (req, res) => {
    try {
      const image = await storage.getImage(Number(req.params.id));
      if (!image) {
        res.status(404).json({ message: "Image not found" });
        return;
      }

      // Set content type based on the image's mimeType
      res.setHeader("Content-Type", image.mimeType);

      // Send the image data
      res.send(Buffer.from(image.data));
    } catch (error) {
      console.error("Failed to get image:", error);
      res.status(500).json({ message: "Failed to get image" });
    }
  });

  app.get("/api/auth/status", (req, res) => {
    // @ts-ignore - checking user in session
    if (!req.session.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    // @ts-ignore - sending user from session
    res.json(req.session.user);
  });
  app.get("/blog/:id", async (req, res, next) => {
    try {
      // Check if it's a social media crawler
      const userAgent = req.get("user-agent") || "";
      const isCrawler =
        /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|pinterest|slack|discordbot/i.test(
          userAgent,
        );

      if (isCrawler) {
        // First try to get post by slug if it's not a number
        const isNumericId = !isNaN(Number(req.params.id));
        const post = isNumericId
          ? await storage.getPost(Number(req.params.id))
          : await storage.getPostBySlug(req.params.id);

        if (!post) {
          res.status(404).send("Post not found");
          return;
        }

        // Don't serve draft posts to crawlers
        if (post.isDraft) {
          res.redirect("/");
          return;
        }

        // Get settings data
        const settings = await storage.getSiteSettings();

        // Record view
        await storage.incrementViews(post.id);

        // Build meta tags based on your Head component logic
        const siteTitle = settings?.blogName || "My Blog";
        const defaultDescription =
          settings?.blogDescription ||
          "Discover interesting articles and insights";
        const pageTitle = (post.metaTitle || post.title || "").trim();
        const metaDescription = (
          post.metaDescription ||
          post.excerpt ||
          defaultDescription ||
          ""
        ).trim();
        const keywords = post.tags.join(",");

        // Get absolute URLs
        const origin = `${req.protocol}://${req.get("host")}`;
        const absoluteUrl = `${origin}${req.originalUrl}`;
        const socialImage = post.socialImageId
          ? `${origin}/api/images/${post.socialImageId}`
          : "";
        const canonical = post.canonicalUrl || absoluteUrl;

        // Escape special characters
        const escapedTitle = pageTitle.replace(/"/g, "&quot;");
        const escapedDescription = metaDescription.replace(/"/g, "&quot;");

        return res.send(`
          <!DOCTYPE html> 
          <html lang="en"> 
            <head> 
              <meta charset="UTF-8"> 
              <meta name="viewport" content="width=device-width, initial-scale=1.0">

              <!-- Basic Meta Tags -->
              <title>${pageTitle ? `${pageTitle} | ${siteTitle}` : siteTitle}</title>
              <meta name="description" content="${metaDescription}">

              <!-- Open Graph / Facebook -->
              <meta property="og:type" content="article">
              <meta property="og:site_name" content="${siteTitle}">
              <meta property="og:title" content="${escapedTitle}">
              <meta property="og:description" content="${escapedDescription}">
              ${socialImage ? `<meta property="og:image" content="${socialImage}">` : ""}
              ${socialImage ? `<meta property="og:image:alt" content="Image for ${escapedTitle}">` : ""}
              <meta property="og:url" content="${canonical}">
              <meta property="og:locale" content="en_US">

              <!-- Twitter -->
              <meta name="twitter:card" content="summary_large_image">
              <meta name="twitter:title" content="${escapedTitle}">
              <meta name="twitter:description" content="${escapedDescription}">
              ${socialImage ? `<meta name="twitter:image" content="${socialImage}">` : ""}
              ${socialImage ? `<meta name="twitter:image:alt" content="Image for ${escapedTitle}">` : ""}

              <!-- LinkedIn -->
              <meta property="linkedin:title" content="${escapedTitle}">
              <meta property="linkedin:description" content="${escapedDescription}">
              ${socialImage ? `<meta property="linkedin:image" content="${socialImage}">` : ""}

              <!-- Pinterest -->
              <meta name="pinterest:title" content="${escapedTitle}">
              <meta name="pinterest:description" content="${escapedDescription}">
              ${socialImage ? `<meta name="pinterest:image" content="${socialImage}">` : ""}

              <!-- Additional SEO tags -->
              ${post.createdAt ? `<meta name="article:published_time" content="${post.createdAt}">` : ""}
              ${post.createdAt ? `<meta name="article:modified_time" content="${post.createdAt}">` : ""}
              ${keywords ? `<meta name="keywords" content="${keywords}">` : ""}

              <!-- Canonical URL -->
              <link rel="canonical" href="${canonical}">
            </head> 
            <body> 
              <h1>${post.title}</h1> 
              <p>${post.excerpt}</p> 
            </body> 
          </html> 
        `);
      } else {
        // For regular users: continue to the next middleware/route
        next();
      }
    } catch (error) {
      console.error("Failed to handle crawler request:", error);
      next(error);
    }
  });
  return createServer(app);
}