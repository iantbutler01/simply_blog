import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./RichTextEditor";
import { ImageUpload } from "./ImageUpload";
import { Plus, GripVertical, X } from "lucide-react";
import { type Block } from "@shared/schema";

interface BlockEditorProps {
  value: Block[];
  onChange: (blocks: Block[]) => void;
}

export function BlockEditor({ value, onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(value);

  // Sync blocks with form value
  useEffect(() => {
    setBlocks(value);
  }, [value]);

  const updateBlock = (index: number, updatedBlock: Block) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const addBlock = (type: "text" | "image", e: React.MouseEvent) => {
    // Prevent form submission and event bubbling
    e.preventDefault();
    e.stopPropagation();

    const newBlock: Block = type === "text" 
      ? { type: "text", content: "", format: "html" }
      : { type: "image", imageId: 0 };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const removeBlock = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const moveBlock = (from: number, to: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(from, 1);
    newBlocks.splice(to, 0, movedBlock);
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  return (
    <div className="space-y-4 w-full">
      {blocks.map((block, index) => (
        <div
          key={index}
          className="group relative flex gap-2 rounded-lg border bg-card p-4 w-full"
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <GripVertical className="h-4 w-4 cursor-move" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => removeBlock(index, e)}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {block.type === "text" && (
            <div className="flex-1">
              <RichTextEditor
                value={block.content}
                onChange={(content) =>
                  updateBlock(index, { ...block, content })
                }
              />
            </div>
          )}

          {block.type === "image" && (
            <div className="flex-1">
              {block.imageId ? (
                <div className="relative aspect-video">
                  <img
                    src={`/uploads/${block.imageId}`}
                    alt={block.alt || ""}
                    className="rounded-lg object-cover"
                  />
                  {block.caption && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {block.caption}
                    </p>
                  )}
                </div>
              ) : (
                <ImageUpload
                  onUpload={(url) =>
                    updateBlock(index, {
                      ...block,
                      imageId: parseInt(url.split('/').pop() || '0', 10),
                    })
                  }
                />
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => addBlock("text", e)}
          type="button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Text
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => addBlock("image", e)}
          type="button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Image
        </Button>
      </div>
    </div>
  );
}