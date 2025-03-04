import { pgTable, text, serial, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
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
    caption: z.string().optional(),
    alt: z.string().optional(),
  }),
]);

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // Store blocks as JSON
  excerpt: text("excerpt").notNull(),
  tags: text("tags").array().notNull(),
  isDraft: boolean("is_draft").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  socialImageId: text("social_image_id"), // Reference to the uploaded image
  canonicalUrl: text("canonical_url"),
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type").notNull(),
  size: text("size").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
    metaTitle: z.string().optional(),
    metaDescription: z.string().max(160, "Meta description should not exceed 160 characters").optional(),
    socialImageId: z.string().optional(),
    canonicalUrl: z.string().url("Must be a valid URL").optional(),
  });

export const insertImageSchema = createInsertSchema(images)
  .omit({ id: true, createdAt: true });

export type Block = z.infer<typeof blockSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;