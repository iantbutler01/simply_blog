import { pgTable, text, serial, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define the block types and their schemas
export const blockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    content: z.string(),
    format: z.string().optional(),
  }),
  z.object({
    type: z.literal("image"),
    imageId: z.number(),
    imageUrl: z.string().optional(), // URL will be a data URL from the database
    caption: z.string().optional(),
    alt: z.string().optional(),
    alignment: z.enum(["left", "center", "right"]).optional().default("center"),
    size: z.enum(["small", "medium", "large", "full"]).optional().default("full"),
  }),
]);

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // Store blocks as JSON
  excerpt: text("excerpt").notNull(),
  tags: text("tags").array().notNull(),
  isDraft: boolean("is_draft").notNull().default(true),
  publishAt: timestamp("publish_at"), // New field for scheduled publishing
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  socialImageId: integer("social_image_id"), // Changed from text to integer
  canonicalUrl: text("canonical_url"),
  // Analytics fields
  views: integer("views").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  readingTimeMinutes: integer("reading_time_minutes").notNull().default(0),
});

// New table for version history
export const postVersions = pgTable("post_versions", {
  id: serial("id").primaryKey(),
  postId: serial("post_id").notNull().references(() => posts.id),
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  excerpt: text("excerpt").notNull(),
  tags: text("tags").array().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: serial("created_by").notNull().references(() => users.id),
  version: serial("version").notNull(), // Incremental version number
  comment: text("comment"), // Optional comment about the version
});

// Images table with binary storage
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  data: text("data").notNull(), // Store base64 image data directly
  mimeType: text("mime_type").notNull(),
  size: text("size").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Add the comments table after the images table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: serial("post_id").notNull().references(() => posts.id),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email"), // Remove .notNull()
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  blogName: text("blog_name").notNull().default("My Blog"),
  blogDescription: text("blog_description").notNull().default("Discover interesting articles and insights"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings)
  .omit({ id: true, updatedAt: true });

export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true })
  .extend({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

export const insertPostSchema = createInsertSchema(posts)
  .omit({ id: true, createdAt: true })
  .extend({
    title: z.string().min(1, "Title is required"),
    content: z.array(blockSchema),
    excerpt: z.string().min(1, "Excerpt is required"),
    tags: z.array(z.string()).min(1, "At least one tag is required"),
    publishAt: z.union([z.date(), z.null()]).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().max(160, "Meta description should not exceed 160 characters").optional(),
    socialImageId: z.number().optional(), // Changed from string to number
    canonicalUrl: z.union([z.string().url("Must be a valid URL"), z.string().max(0), z.null()]).optional(),
    views: z.number().optional(),
    shareCount: z.number().optional(),
    readingTimeMinutes: z.number().optional(),
  });

export const insertVersionSchema = createInsertSchema(postVersions)
  .omit({ id: true, createdAt: true, version: true })
  .extend({
    comment: z.string().optional(),
  });

export const insertImageSchema = createInsertSchema(images)
  .omit({ id: true, createdAt: true })
  .extend({
    data: z.string().min(1, "Image data is required"),
    filename: z.string().min(1, "Filename is required"),
    mimeType: z.string().min(1, "MIME type is required"),
    size: z.string().min(1, "Size is required"),
  });

// Update the comment schema validation
export const insertCommentSchema = createInsertSchema(comments)
  .omit({ id: true, createdAt: true, isApproved: true })
  .extend({
    content: z.string().min(1, "Comment is required").max(1000, "Comment is too long"),
    authorName: z.string().min(1, "Name is required"),
    authorEmail: z.string().email("Invalid email address").nullish(),
  });

export type Block = z.infer<typeof blockSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertVersion = z.infer<typeof insertVersionSchema>;
export type PostVersion = typeof postVersions.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
// Add comment types to exports
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;