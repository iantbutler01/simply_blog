import { useState } from "react";
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

  const updateBlock = (index: number, updatedBlock: Block) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const addBlock = (type: "text" | "image") => {
    const newBlock: Block = type === "text" 
      ? { type: "text", content: "", format: "html" }
      : { type: "image", imageId: 0 };
    
    setBlocks([...blocks, newBlock]);
    onChange([...blocks, newBlock]);
  };

  const removeBlock = (index: number) => {
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
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div
          key={index}
          className="group relative flex gap-2 rounded-lg border bg-card p-4"
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <GripVertical className="h-4 w-4 cursor-move" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => removeBlock(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {block.type === "text" && (
            <RichTextEditor
              value={block.content}
              onChange={(content) =>
                updateBlock(index, { ...block, content })
              }
            />
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
                  onUpload={(image) =>
                    updateBlock(index, {
                      ...block,
                      imageId: image.id,
                      alt: image.filename,
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
          onClick={() => addBlock("text")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Text
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock("image")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Image
        </Button>
      </div>
    </div>
  );
}
