import { posts, type Post, type InsertPost, images, type Image, type InsertImage, users, type User, type InsertUser, postVersions, type PostVersion, comments, type Comment, type InsertComment, siteSettings, type SiteSettings, type InsertSiteSettings } from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, sql, and, lt, isNotNull } from "drizzle-orm";
import * as crypto from 'crypto';
import { calculateReadingTime } from "./utils/analytics";
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import * as fs from 'fs/promises'; // Import fs.promises

const PostgresStore = connectPg(session);

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
  saveVersion(postId: number, version: InsertPost): Promise<PostVersion>;
  getVersions(postId: number): Promise<PostVersion[]>;
  getVersion(versionId: number): Promise<PostVersion | undefined>;
  getScheduledPosts(): Promise<Post[]>;
  publishScheduledPosts(): Promise<void>;
  publishPost(id: number): Promise<Post>;

  // Analytics methods
  incrementViews(id: number): Promise<void>;
  incrementShareCount(id: number): Promise<void>;
  updateReadingTime(id: number, content: any[]): Promise<void>;
  sessionStore: session.Store;

  // Comment methods
  createComment(comment: InsertComment): Promise<Comment>;
  getApprovedComments(postId: number): Promise<Comment[]>;
  getPendingComments(): Promise<Comment[]>;
  approveComment(id: number): Promise<Comment>;
  deleteComment(id: number): Promise<void>;

  // Add site settings methods
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(settings: Partial<InsertSiteSettings>): Promise<SiteSettings>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize PostgreSQL session store
    this.sessionStore = new PostgresStore({
      createTableIfMissing: true,
      tableName: 'user_sessions',
      // Use the existing database connection
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      }
    });
  }

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
      const readingTimeMinutes = calculateReadingTime(insertPost.content);

      const [post] = await db
        .insert(posts)
        .values({
          ...insertPost,
          readingTimeMinutes,
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
      const updates = { ...updatePost };

      // If content is being updated, recalculate reading time
      if (updates.content) {
        updates.readingTimeMinutes = calculateReadingTime(updates.content);
      }

      const [post] = await db
        .update(posts)
        .set(updates)
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

  async saveVersion(postId: number, version: InsertPost): Promise<PostVersion> {
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

      console.log(`Unpublished post ${postId} before saving version ${nextVersion}`);

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

  async incrementViews(id: number): Promise<void> {
    try {
      await db
        .update(posts)
        .set({
          views: sql`${posts.views} + 1`
        })
        .where(eq(posts.id, id));

      console.log(`Incremented views for post ${id}`);
    } catch (error) {
      console.error(`Failed to increment views for post ${id}:`, error);
      throw error;
    }
  }

  async incrementShareCount(id: number): Promise<void> {
    try {
      await db
        .update(posts)
        .set({
          shareCount: sql`${posts.shareCount} + 1`
        })
        .where(eq(posts.id, id));

      console.log(`Incremented share count for post ${id}`);
    } catch (error) {
      console.error(`Failed to increment share count for post ${id}:`, error);
      throw error;
    }
  }

  async updateReadingTime(id: number, content: any[]): Promise<void> {
    try {
      const readingTimeMinutes = calculateReadingTime(content);

      await db
        .update(posts)
        .set({ readingTimeMinutes })
        .where(eq(posts.id, id));

      console.log(`Updated reading time for post ${id} to ${readingTimeMinutes} minutes`);
    } catch (error) {
      console.error(`Failed to update reading time for post ${id}:`, error);
      throw error;
    }
  }

  // Comment management methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    try {
      const [comment] = await db
        .insert(comments)
        .values({
          ...insertComment,
          createdAt: new Date(),
        })
        .returning();
      console.log('Created new comment:', comment.id);
      return comment;
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  }

  async getApprovedComments(postId: number): Promise<Comment[]> {
    try {
      const results = await db
        .select()
        .from(comments)
        .where(and(eq(comments.postId, postId), eq(comments.isApproved, true)))
        .orderBy(desc(comments.createdAt));
      console.log(`Retrieved ${results.length} approved comments for post ${postId}`);
      return results;
    } catch (error) {
      console.error(`Failed to get approved comments for post ${postId}:`, error);
      throw error;
    }
  }

  async getPendingComments(): Promise<Comment[]> {
    try {
      const results = await db
        .select()
        .from(comments)
        .where(eq(comments.isApproved, false))
        .orderBy(desc(comments.createdAt));
      console.log(`Retrieved ${results.length} pending comments`);
      return results;
    } catch (error) {
      console.error('Failed to get pending comments:', error);
      throw error;
    }
  }

  async approveComment(commentId: number): Promise<Comment> {
    try {
      const [comment] = await db
        .update(comments)
        .set({ isApproved: true })
        .where(eq(comments.id, commentId))
        .returning();
      if (!comment) throw new Error("Comment not found");
      console.log(`Approved comment ${commentId}`);
      return comment;
    } catch (error) {
      console.error(`Failed to approve comment ${commentId}:`, error);
      throw error;
    }
  }

  async deleteComment(commentId: number): Promise<void> {
    try {
      await db.delete(comments).where(eq(comments.id, commentId));
      console.log(`Deleted comment ${commentId}`);
    } catch (error) {
      console.error(`Failed to delete comment ${commentId}:`, error);
      throw error;
    }
  }

  async getSiteSettings(): Promise<SiteSettings> {
    try {
      const [settings] = await db.select().from(siteSettings).limit(1);
      if (!settings) {
        // Return default settings if none exist
        return {
          id: 1,
          blogName: "My Blog",
          blogDescription: "Discover interesting articles and insights",
          themePrimary: "#007ACC",
          themeVariant: "professional",
          themeAppearance: "system",
          themeRadius: 0,
          updatedAt: new Date(),
        };
      }
      return settings;
    } catch (error) {
      console.error('Failed to get site settings:', error);
      throw error;
    }
  }

  async updateSiteSettings(updates: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    try {
      // Get existing settings or create default
      let [settings] = await db.select().from(siteSettings).limit(1);

      if (settings) {
        // Update existing settings
        [settings] = await db
          .update(siteSettings)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(siteSettings.id, settings.id))
          .returning();
      } else {
        // Create new settings
        [settings] = await db
          .insert(siteSettings)
          .values({
            ...updates,
            updatedAt: new Date(),
          })
          .returning();
      }

      // Update theme.json with the new settings
      const themeConfig = {
        primary: settings.themePrimary,
        variant: settings.themeVariant,
        appearance: settings.themeAppearance,
        radius: settings.themeRadius,
      };

      // Write the theme configuration
      await fs.promises.writeFile('theme.json', JSON.stringify(themeConfig, null, 2));

      console.log('Updated site settings:', settings);
      return settings;
    } catch (error) {
      console.error('Failed to update site settings:', error);
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