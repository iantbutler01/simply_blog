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
    try {
      const result = await db.select().from(posts).orderBy(desc(posts.createdAt));
      console.log(`Retrieved ${result.length} posts from database`);
      return result;
    } catch (error) {
      console.error('Failed to get posts:', error);
      throw error;
    }
  }

  async getPost(id: number): Promise<Post | undefined> {
    try {
      const [post] = await db.select().from(posts).where(eq(posts.id, id));
      console.log(`Retrieved post ${id}:`, post ? 'found' : 'not found');
      return post;
    } catch (error) {
      console.error(`Failed to get post ${id}:`, error);
      throw error;
    }
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    try {
      const [post] = await db
        .insert(posts)
        .values({
          ...insertPost,
          createdAt: new Date(),
        })
        .returning();
      console.log('Created new post:', post.id);
      return post;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }

  async updatePost(id: number, updatePost: Partial<InsertPost>): Promise<Post> {
    try {
      const [post] = await db
        .update(posts)
        .set(updatePost)
        .where(eq(posts.id, id))
        .returning();

      if (!post) throw new Error("Post not found");
      console.log(`Updated post ${id}`);
      return post;
    } catch (error) {
      console.error(`Failed to update post ${id}:`, error);
      throw error;
    }
  }

  async deletePost(id: number): Promise<void> {
    try {
      await db.delete(posts).where(eq(posts.id, id));
      console.log(`Deleted post ${id}`);
    } catch (error) {
      console.error(`Failed to delete post ${id}:`, error);
      throw error;
    }
  }

  async searchPosts(query: string): Promise<Post[]> {
    try {
      const results = await db
        .select()
        .from(posts)
        .where(
          or(
            sql`${posts.title} ILIKE ${`%${query}%`}`,
            sql`${posts.content} ILIKE ${`%${query}%`}`
          )
        )
        .orderBy(desc(posts.createdAt));
      console.log(`Search "${query}" returned ${results.length} posts`);
      return results;
    } catch (error) {
      console.error(`Failed to search posts with query "${query}":`, error);
      throw error;
    }
  }

  async getPostsByTag(tag: string): Promise<Post[]> {
    try {
      const results = await db
        .select()
        .from(posts)
        .where(sql`${tag} = ANY(${posts.tags})`)
        .orderBy(desc(posts.createdAt));
      console.log(`Found ${results.length} posts with tag "${tag}"`);
      return results;
    } catch (error) {
      console.error(`Failed to get posts with tag "${tag}":`, error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();