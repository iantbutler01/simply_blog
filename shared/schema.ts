import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  tags: text("tags").array().notNull(),
  isDraft: boolean("is_draft").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPostSchema = createInsertSchema(posts)
  .omit({ id: true, createdAt: true })
  .extend({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    excerpt: z.string().min(1, "Excerpt is required"),
    tags: z.array(z.string()).min(1, "At least one tag is required"),
  });

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
