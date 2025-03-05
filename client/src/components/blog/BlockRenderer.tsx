import { type Block } from "@shared/schema";
import { TextBlock } from "./TextBlock";
import { ImageBlock } from "./ImageBlock";
import { CTABlock } from "./CTABlock";

interface BlockRendererProps {
  block: Block;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  switch (block.type) {
    case "text":
      return <TextBlock block={block} />;
    case "image":
      return <ImageBlock block={block} />;
    case "cta":
      return <CTABlock block={block} />;
    default:
      return null;
  }
}
