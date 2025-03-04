import { posts, type Post, type InsertPost, images, type Image, type InsertImage } from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, sql } from "drizzle-orm";

export interface IStorage {
  // Post methods
  getPosts(): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  searchPosts(query: string): Promise<Post[]>;
  getPostsByTag(tag: string): Promise<Post[]>;

  // Image methods
  getImage(id: number): Promise<Image | undefined>;
  createImage(image: InsertImage): Promise<Image>;
  deleteImage(id: number): Promise<void>;
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

  async getImage(id: number): Promise<Image | undefined> {
    try {
      const [image] = await db.select().from(images).where(eq(images.id, id));
      console.log(`Retrieved image ${id}:`, image ? 'found' : 'not found');
      return image;
    } catch (error) {
      console.error(`Failed to get image ${id}:`, error);
      throw error;
    }
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    try {
      const [image] = await db
        .insert(images)
        .values({
          ...insertImage,
          createdAt: new Date(),
        })
        .returning();
      console.log('Created new image:', image.id);
      return image;
    } catch (error) {
      console.error('Failed to create image:', error);
      throw error;
    }
  }

  async deleteImage(id: number): Promise<void> {
    try {
      await db.delete(images).where(eq(images.id, id));
      console.log(`Deleted image ${id}`);
    } catch (error) {
      console.error(`Failed to delete image ${id}:`, error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();