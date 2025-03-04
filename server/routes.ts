import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertPostSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
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