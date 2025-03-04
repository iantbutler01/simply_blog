import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./RichTextEditor";
import { ImageUpload } from "./ImageUpload";
import { Plus, GripVertical, X, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon } from "lucide-react";
import { type Block } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

interface BlockEditorProps {
  value: Block[];
  onChange: (blocks: Block[]) => void;
}

export function BlockEditor({ value, onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(value);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync blocks with form value
  useEffect(() => {
    if (JSON.stringify(blocks) !== JSON.stringify(value)) {
      setBlocks(value);
    }
  }, [value]);

  const updateBlock = (index: number, updatedBlock: Block) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const addBlock = (type: "text" | "image", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newBlock: Block = type === "text"
      ? { type: "text", content: "", format: "html" }
      : { type: "image", imageId: 0, alignment: "center", size: "full" };

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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;

    if (draggedIndex !== null && draggedIndex !== index) {
      const rect = target.getBoundingClientRect();
      const middleY = rect.top + rect.height / 2;

      if (e.clientY < middleY) {
        target.style.borderTop = "2px solid var(--primary)";
        target.style.borderBottom = "";
      } else {
        target.style.borderTop = "";
        target.style.borderBottom = "2px solid var(--primary)";
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    target.style.borderTop = "";
    target.style.borderBottom = "";
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    target.style.borderTop = "";
    target.style.borderBottom = "";

    if (draggedIndex === null) return;

    const rect = target.getBoundingClientRect();
    const middleY = rect.top + rect.height / 2;

    if (e.clientY > middleY) {
      index += 1;
    }

    if (draggedIndex !== index) {
      moveBlock(draggedIndex, index);
    }

    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4 w-full">
      {blocks.map((block, index) => (
        <div
          key={index}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          className="group relative flex gap-2 border bg-card rounded-lg overflow-hidden"
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
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

          <div className="flex-1 min-w-0 p-4">
            {block.type === "text" && (
              <RichTextEditor
                value={block.content}
                onChange={(content) =>
                  updateBlock(index, { ...block, content })
                }
              />
            )}

            {block.type === "image" && (
              <div className="space-y-4">
                {block.imageId ? (
                  <div className="relative">
                    <img
                      src={`/api/images/${block.imageId}`}
                      alt={block.alt || ""}
                      className={`rounded-lg ${
                        block.size === "small" ? "max-w-sm" :
                        block.size === "medium" ? "max-w-lg" :
                        block.size === "large" ? "max-w-2xl" :
                        "w-full"
                      } ${
                        block.alignment === "left" ? "mr-auto" :
                        block.alignment === "right" ? "ml-auto" :
                        "mx-auto"
                      }`}
                    />
                    <div className="absolute top-2 right-2 flex gap-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
                      <Toggle
                        size="sm"
                        pressed={block.alignment === "left"}
                        onPressedChange={() => updateBlock(index, { ...block, alignment: "left" })}
                        aria-label="Align left"
                      >
                        <AlignLeft className="h-4 w-4 text-white" />
                      </Toggle>
                      <Toggle
                        size="sm"
                        pressed={block.alignment === "center"}
                        onPressedChange={() => updateBlock(index, { ...block, alignment: "center" })}
                        aria-label="Align center"
                      >
                        <AlignCenter className="h-4 w-4 text-white" />
                      </Toggle>
                      <Toggle
                        size="sm"
                        pressed={block.alignment === "right"}
                        onPressedChange={() => updateBlock(index, { ...block, alignment: "right" })}
                        aria-label="Align right"
                      >
                        <AlignRight className="h-4 w-4 text-white" />
                      </Toggle>
                      <Select
                        value={block.size}
                        onValueChange={(value: "small" | "medium" | "large" | "full") =>
                          updateBlock(index, { ...block, size: value })
                        }
                      >
                        <SelectTrigger className="h-8 w-24 bg-transparent text-white border-white/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <ImageUpload
                      onUpload={(imageId) => {
                        updateBlock(index, {
                          ...block,
                          imageId,
                        });
                      }}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Input
                    placeholder="Image caption (optional)"
                    value={block.caption || ""}
                    onChange={(e) => updateBlock(index, { ...block, caption: e.target.value })}
                  />
                  <Input
                    placeholder="Alt text for accessibility"
                    value={block.alt || ""}
                    onChange={(e) => updateBlock(index, { ...block, alt: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
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