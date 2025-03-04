import { posts, type Post, type InsertPost } from "@shared/schema";

export interface IStorage {
  getPosts(): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  searchPosts(query: string): Promise<Post[]>;
  getPostsByTag(tag: string): Promise<Post[]>;
}

export class MemStorage implements IStorage {
  private posts: Map<number, Post>;
  private currentId: number;

  constructor() {
    this.posts = new Map();
    this.currentId = 1;
  }

  async getPosts(): Promise<Post[]> {
    return Array.from(this.posts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.currentId++;
    const post: Post = {
      ...insertPost,
      id,
      createdAt: new Date(),
    };
    this.posts.set(id, post);
    return post;
  }

  async updatePost(id: number, updatePost: Partial<InsertPost>): Promise<Post> {
    const existing = await this.getPost(id);
    if (!existing) throw new Error("Post not found");
    
    const updated: Post = {
      ...existing,
      ...updatePost,
    };
    this.posts.set(id, updated);
    return updated;
  }

  async deletePost(id: number): Promise<void> {
    this.posts.delete(id);
  }

  async searchPosts(query: string): Promise<Post[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.posts.values()).filter(post => 
      post.title.toLowerCase().includes(lowercaseQuery) ||
      post.content.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getPostsByTag(tag: string): Promise<Post[]> {
    return Array.from(this.posts.values()).filter(post =>
      post.tags.includes(tag)
    );
  }
}

export const storage = new MemStorage();
