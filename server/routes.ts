import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertPostSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  app.get("/api/posts", async (req, res) => {
    const { search, tag } = req.query;

    let posts;
    if (search && typeof search === "string") {
      posts = await storage.searchPosts(search);
    } else if (tag && typeof tag === "string") {
      posts = await storage.getPostsByTag(tag);
    } else {
      posts = await storage.getPosts();
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
