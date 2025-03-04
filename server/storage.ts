import { posts, type Post, type InsertPost, images, type Image, type InsertImage, users, type User, type InsertUser, postVersions, type PostVersion, type InsertVersion } from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, sql, and, lt, isNotNull } from "drizzle-orm";
import * as crypto from 'crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(stored: string, supplied: string): boolean {
  const [salt, hash] = stored.split(':');
  const suppliedHash = crypto.pbkdf2Sync(supplied, salt, 1000, 64, 'sha512').toString('hex');
  return hash === suppliedHash;
}

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

  // User methods
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateCredentials(username: string, password: string): Promise<User | undefined>;
  saveVersion(postId: number, version: InsertVersion): Promise<PostVersion>;
  getVersions(postId: number): Promise<PostVersion[]>;
  getVersion(versionId: number): Promise<PostVersion | undefined>;
  getScheduledPosts(): Promise<Post[]>;
  publishScheduledPosts(): Promise<void>;
  publishPost(id: number): Promise<Post>;
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error(`Failed to get user ${username}:`, error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const hashedPassword = hashPassword(insertUser.password);
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          password: hashedPassword,
          createdAt: new Date(),
        })
        .returning();
      console.log('Created new user:', user.id);
      return user;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async validateCredentials(username: string, password: string): Promise<User | undefined> {
    try {
      const user = await this.getUserByUsername(username);
      if (!user || !verifyPassword(user.password, password)) {
        return undefined;
      }
      return user;
    } catch (error) {
      console.error('Failed to validate credentials:', error);
      throw error;
    }
  }

  async saveVersion(postId: number, version: InsertVersion): Promise<PostVersion> {
    try {
      // First get the current version number
      const [latestVersion] = await db
        .select()
        .from(postVersions)
        .where(eq(postVersions.postId, postId))
        .orderBy(desc(postVersions.version))
        .limit(1);

      const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

      // First unpublish the post if it's currently published
      await db
        .update(posts)
        .set({ isDraft: true })
        .where(eq(posts.id, postId));

      // Then save the version
      const [savedVersion] = await db
        .insert(postVersions)
        .values({
          ...version,
          postId,
          version: nextVersion,
          createdAt: new Date(),
        })
        .returning();

      console.log(`Created new version for post ${postId}:`, savedVersion.id);
      return savedVersion;
    } catch (error) {
      console.error(`Failed to create version for post ${postId}:`, error);
      throw error;
    }
  }

  async getVersions(postId: number): Promise<PostVersion[]> {
    try {
      const versions = await db
        .select()
        .from(postVersions)
        .where(eq(postVersions.postId, postId))
        .orderBy(desc(postVersions.createdAt));
      console.log(`Retrieved ${versions.length} versions for post ${postId}`);
      return versions;
    } catch (error) {
      console.error(`Failed to get versions for post ${postId}:`, error);
      throw error;
    }
  }

  async getVersion(versionId: number): Promise<PostVersion | undefined> {
    try {
      const [version] = await db
        .select()
        .from(postVersions)
        .where(eq(postVersions.id, versionId));
      console.log(`Retrieved version ${versionId}:`, version ? 'found' : 'not found');
      return version;
    } catch (error) {
      console.error(`Failed to get version ${versionId}:`, error);
      throw error;
    }
  }

  async getScheduledPosts(): Promise<Post[]> {
    try {
      const now = new Date();
      const posts = await db
        .select()
        .from(posts)
        .where(
          and(
            eq(posts.isDraft, true),
            lt(posts.publishAt, now),
            isNotNull(posts.publishAt)
          )
        );
      console.log(`Found ${posts.length} posts ready to publish`);
      return posts;
    } catch (error) {
      console.error('Failed to get scheduled posts:', error);
      throw error;
    }
  }

  async publishScheduledPosts(): Promise<void> {
    try {
      const now = new Date();
      await db
        .update(posts)
        .set({ isDraft: false })
        .where(
          and(
            eq(posts.isDraft, true),
            lt(posts.publishAt, now),
            isNotNull(posts.publishAt)
          )
        );
      console.log('Published scheduled posts');
    } catch (error) {
      console.error('Failed to publish scheduled posts:', error);
      throw error;
    }
  }
  async publishPost(id: number): Promise<Post> {
    try {
      const [post] = await db
        .update(posts)
        .set({
          isDraft: false,
          publishAt: null
        })
        .where(eq(posts.id, id))
        .returning();

      if (!post) throw new Error("Post not found");
      console.log(`Published post ${id} immediately`);
      return post;
    } catch (error) {
      console.error(`Failed to publish post ${id}:`, error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();

// Create initial admin user if it doesn't exist
async function createInitialAdmin() {
  try {
    const existingAdmin = await storage.getUserByUsername('admin');
    if (!existingAdmin) {
      await storage.createUser({
        username: 'admin',
        password: 'bismuth@#!password1234',
        isAdmin: true
      });
      console.log('Created initial admin user');
    }
  } catch (error) {
    console.error('Failed to create initial admin:', error);
  }
}

createInitialAdmin();

//This is necessary because the edited code doesn't define these types.  Replace with your actual types.
interface InsertVersion {
  content: string;
  // Add other relevant fields
}

interface PostVersion {
  id: number;
  postId: number;
  content: string;
  createdAt: Date;
  version: number; // Added version field
  // Add other relevant fields
}