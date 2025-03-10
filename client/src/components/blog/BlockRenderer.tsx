import { type Block } from "@shared/schema";
import { CTABlock } from "./CTABlock";

interface BlockRendererProps {
  block: Block;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  switch (block.type) {
    case "text":
      return (
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
    case "image":
      if (!block.imageId) return null;
      return (
        <figure className="my-12">
          <div
            className={`flex ${
              block.alignment === "left"
                ? "justify-start"
                : block.alignment === "right"
                ? "justify-end"
                : "justify-center"
            }`}
          >
            <div
              style={{
                width:
                  block.size === "small"
                    ? "300px"
                    : block.size === "medium"
                    ? "500px"
                    : block.size === "large"
                    ? "800px"
                    : "100%",
                maxWidth: "100%",
              }}
            >
              <img
                src={`/api/images/${block.imageId}`}
                alt={block.alt || ""}
                className="rounded-lg border w-full h-auto object-contain"
                style={{ minHeight: "200px" }}
              />
            </div>
          </div>
          {block.caption && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">{block.caption}</p>
            </div>
          )}
        </figure>
      );
    case "cta":
      return (
        <div className="my-12">
          <CTABlock block={block} />
        </div>
      );
    case "youtube":
      return (
        <div className="my-12 relative w-full aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${block.videoId}`}
            title={block.title || "YouTube video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full rounded-lg border"
          />
        </div>
      );
    default:
      return null;
  }
}