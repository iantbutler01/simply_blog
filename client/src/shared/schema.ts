// Add imageUrl to the Image type
export type Image = {
  id: number;
  filename: string;
  url: string;
  mimeType: string;
  size: string;
  createdAt: Date;
};

// Add url to the Block type
export type Block = {
  type: "text";
  content: string;
  format: string;
} | {
  type: "image";
  imageId: number;
  imageUrl?: string;  // Add this
  caption?: string;
  alt?: string;
  alignment?: "left" | "center" | "right";
  size?: "small" | "medium" | "large" | "full";
};
