import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Block } from "@shared/schema";

interface CTABlockProps {
  block: Block & { type: "cta" };
}

export function CTABlock({ block }: CTABlockProps) {
  return (
    <div
      className={cn(
        "my-8 space-y-4",
        block.alignment === "center" && "text-center",
        block.alignment === "right" && "text-right"
      )}
    >
      <p className="text-lg">{block.content}</p>
      <Button
        variant={block.buttonVariant}
        size="lg"
        asChild
      >
        <a href={block.buttonUrl} target="_blank" rel="noopener noreferrer">
          {block.buttonText}
        </a>
      </Button>
    </div>
  );
}
