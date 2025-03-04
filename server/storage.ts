import { posts, type Post, type InsertPost } from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, sql } from "drizzle-orm";

export interface IStorage {
  getPosts(): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  searchPosts(query: string): Promise<Post[]>;
  getPostsByTag(tag: string): Promise<Post[]>;
}

export class DatabaseStorage implements IStorage {
  async getPosts(): Promise<Post[]> {
    return db.select().from(posts).orderBy(desc(posts.createdAt));
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values({
        ...insertPost,
        createdAt: new Date(),
      })
      .returning();
    return post;
  }

  async updatePost(id: number, updatePost: Partial<InsertPost>): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set(updatePost)
      .where(eq(posts.id, id))
      .returning();

    if (!post) throw new Error("Post not found");
    return post;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async searchPosts(query: string): Promise<Post[]> {
    return db
      .select()
      .from(posts)
      .where(
        or(
          sql`${posts.title} ILIKE ${`%${query}%`}`,
          sql`${posts.content} ILIKE ${`%${query}%`}`
        )
      )
      .orderBy(desc(posts.createdAt));
  }

  async getPostsByTag(tag: string): Promise<Post[]> {
    return db
      .select()
      .from(posts)
      .where(sql`${tag} = ANY(${posts.tags})`)
      .orderBy(desc(posts.createdAt));
  }
}

export const storage = new DatabaseStorage();