import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./RichTextEditor";
import { ImageUpload } from "./ImageUpload";
import {
  Plus,
  GripVertical,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Youtube,
} from "lucide-react";
import { type Block } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { CTABlockEditor } from "./CTABlockEditor";

interface BlockEditorProps {
  value: Block[];
  onChange: (blocks: Block[]) => void;
}

const extractYoutubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export function BlockEditor({ value, onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(value);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isYoutubeDialogOpen, setIsYoutubeDialogOpen] = useState(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);

  useEffect(() => {
    if (JSON.stringify(blocks) !== JSON.stringify(value)) {
      setBlocks(value);
    }
  }, [value]);

  const updateBlock = (index: number, updatedBlock: Block) => {
    // Migrate single image to multi-image if needed
    if (updatedBlock.type === "image") {
      if (updatedBlock.imageId !== undefined && !updatedBlock.imageIds) {
        updatedBlock = {
          ...updatedBlock,
          imageIds: [updatedBlock.imageId],
          imageUrls: updatedBlock.imageUrl ? [updatedBlock.imageUrl] : [],
          captions: updatedBlock.caption ? [updatedBlock.caption] : [],
          alts: updatedBlock.alt ? [updatedBlock.alt] : [],
          layout: "row",
        };
      }
    }

    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const addBlock = (type: "text" | "image" | "cta" | "youtube", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    var newBlock: Block | null = null;

    switch (type) {
      case "text":
        newBlock = { type: "text", content: "", format: "html" };
        break;
      case "image":
        newBlock = {
          type: "image",
          imageIds: [],
          imageUrls: [],
          captions: [],
          alts: [],
          alignment: "center",
          size: "full",
          layout: "row",
        };
        break;
      case "cta":
        newBlock = {
          type: "cta",
          content: "",
          buttonText: "Click here",
          buttonUrl: "",
          alignment: "center",
          buttonVariant: "default",
        };
        break;
      case "youtube":
        setIsYoutubeDialogOpen(true);
        return;
    }

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const handleYoutubeSubmit = () => {
    const videoId = extractYoutubeId(youtubeUrl);
    if (!videoId) {
      alert("Invalid YouTube URL");
      return;
    }

    const newBlock: Block = {
      type: "youtube",
      videoId,
      title: `YouTube video (${videoId})`,
      alignment: "center",
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    onChange(newBlocks);
    setYoutubeUrl("");
    setIsYoutubeDialogOpen(false);
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
          className="group relative flex gap-2 border bg-card rounded-lg overflow-hidden"
        >
          <div
            className="flex flex-col items-center gap-2 text-muted-foreground p-4 border-r bg-muted/10"
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(e) => {
              e.preventDefault();
              const target = e.currentTarget.parentElement;
              if (!target || draggedIndex === null || draggedIndex === index) return;

              const rect = target.getBoundingClientRect();
              const middleY = rect.top + rect.height / 2;

              if (e.clientY < middleY) {
                target.style.borderTop = "2px solid var(--primary)";
                target.style.borderBottom = "";
              } else {
                target.style.borderTop = "";
                target.style.borderBottom = "2px solid var(--primary)";
              }
            }}
            onDragLeave={(e) => {
              const target = e.currentTarget.parentElement;
              if (!target) return;
              target.style.borderTop = "";
              target.style.borderBottom = "";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const target = e.currentTarget.parentElement;
              if (!target || draggedIndex === null) return;

              target.style.borderTop = "";
              target.style.borderBottom = "";

              const rect = target.getBoundingClientRect();
              const middleY = rect.top + rect.height / 2;

              let finalIndex = index;
              if (e.clientY > middleY) {
                finalIndex += 1;
              }

              if (draggedIndex !== finalIndex) {
                moveBlock(draggedIndex, finalIndex);
              }

              setDraggedIndex(null);
            }}
          >
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
                {((block.imageIds && block.imageIds.length > 0) || block.imageId) ? (
                  <div className="pt-12">
                    <div className="absolute top-0 right-0 flex gap-2 bg-background border shadow-sm rounded-lg p-2 z-10">
                      <Toggle
                        size="sm"
                        pressed={block.alignment === "left"}
                        onPressedChange={() =>
                          updateBlock(index, { ...block, alignment: "left" })
                        }
                        aria-label="Align left"
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Toggle>
                      <Toggle
                        size="sm"
                        pressed={block.alignment === "center"}
                        onPressedChange={() =>
                          updateBlock(index, { ...block, alignment: "center" })
                        }
                        aria-label="Align center"
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Toggle>
                      <Toggle
                        size="sm"
                        pressed={block.alignment === "right"}
                        onPressedChange={() =>
                          updateBlock(index, { ...block, alignment: "right" })
                        }
                        aria-label="Align right"
                      >
                        <AlignRight className="h-4 w-4" />
                      </Toggle>

                      <Select
                        value={block.size}
                        onValueChange={(
                          value: "small" | "medium" | "large" | "full",
                        ) => updateBlock(index, { ...block, size: value })}
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                        </SelectContent>
                      </Select>

                      {block.imageIds && block.imageIds.length > 1 && (
                        <Select
                          value={block.layout}
                          onValueChange={(value: "row" | "column" | "carousel") =>
                            updateBlock(index, { ...block, layout: value })
                          }
                        >
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="row">Row</SelectItem>
                            <SelectItem value="column">Column</SelectItem>
                            <SelectItem value="carousel">Carousel</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
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
                        {block.imageId ? (
                          <div>
                            <img
                              src={`/api/images/${block.imageId}`}
                              alt={block.alt || ""}
                              className="rounded-lg border w-full h-auto object-contain"
                              style={{ minHeight: "200px" }}
                            />
                            {block.caption && (
                              <p className="text-sm text-muted-foreground mt-2 text-center">
                                {block.caption}
                              </p>
                            )}
                          </div>
                        ) : block.imageIds && block.imageIds.length > 0 ? (
                          <div
                            className={`grid gap-4 ${
                              block.layout === "row"
                                ? "grid-flow-col auto-cols-fr"
                                : block.layout === "column"
                                ? "grid-flow-row"
                                : ""
                            }`}
                          >
                            {block.imageIds.map((imageId, imgIndex) => (
                              <div key={imageId}>
                                <img
                                  src={`/api/images/${imageId}`}
                                  alt={block.alts?.[imgIndex] || ""}
                                  className="rounded-lg border w-full h-auto object-contain"
                                  style={{ minHeight: "200px" }}
                                />
                                {block.captions?.[imgIndex] && (
                                  <p className="text-sm text-muted-foreground mt-2 text-center">
                                    {block.captions[imgIndex]}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <ImageUpload
                      onUpload={(imageId, imageUrl) => {
                        updateBlock(index, {
                          ...block,
                          imageIds: [imageId],
                          imageUrls: [imageUrl],
                          captions: [""],
                          alts: [""],
                        });
                      }}
                    />
                  </div>
                )}
                {block.imageId ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="Image caption (optional)"
                        value={block.caption || ""}
                        onChange={(e) =>
                          updateBlock(index, { ...block, caption: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Alt text for accessibility"
                        value={block.alt || ""}
                        onChange={(e) =>
                          updateBlock(index, { ...block, alt: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Convert single image to multiple images
                          updateBlock(index, {
                            ...block,
                            imageIds: block.imageId ? [block.imageId] : [],
                            imageUrls: block.imageUrl ? [block.imageUrl] : [],
                            captions: block.caption ? [block.caption] : [],
                            alts: block.alt ? [block.alt] : [],
                            layout: "row",
                            // Remove single image properties
                            imageId: undefined,
                            imageUrl: undefined,
                            caption: undefined,
                            alt: undefined,
                          });
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Another Image
                      </Button>
                    </div>
                  </div>
                ) : block.imageIds && block.imageIds.length > 0 ? (
                  <div className="space-y-4">
                    {block.imageIds.map((_, imgIndex) => (
                      <div key={imgIndex} className="space-y-2">
                        <Input
                          placeholder={`Image ${imgIndex + 1} caption (optional)`}
                          value={block.captions?.[imgIndex] || ""}
                          onChange={(e) => {
                            const newCaptions = [...(block.captions || [])];
                            newCaptions[imgIndex] = e.target.value;
                            updateBlock(index, { ...block, captions: newCaptions });
                          }}
                        />
                        <Input
                          placeholder={`Image ${imgIndex + 1} alt text for accessibility`}
                          value={block.alts?.[imgIndex] || ""}
                          onChange={(e) => {
                            const newAlts = [...(block.alts || [])];
                            newAlts[imgIndex] = e.target.value;
                            updateBlock(index, { ...block, alts: newAlts });
                          }}
                        />
                      </div>
                    ))}
                    <div className="flex justify-center">
                      <ImageUpload
                        onUpload={(imageId, imageUrl) => {
                          updateBlock(index, {
                            ...block,
                            imageIds: [...(block.imageIds || []), imageId],
                            imageUrls: [...(block.imageUrls || []), imageUrl],
                            captions: [...(block.captions || []), ""],
                            alts: [...(block.alts || []), ""],
                          });
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {block.type === "cta" && (
              <CTABlockEditor
                block={block}
                onChange={(updatedBlock) => updateBlock(index, updatedBlock)}
                onRemove={(e) => removeBlock(index, e)}
              />
            )}

            {block.type === "youtube" && (
              <div className="space-y-4 pt-12">
                <div className="absolute top-0 right-0 flex gap-2 bg-background border shadow-sm rounded-lg p-2 z-10">
                  <Toggle
                    size="sm"
                    pressed={block.alignment === "left"}
                    onPressedChange={() =>
                      updateBlock(index, { ...block, alignment: "left" })
                    }
                    aria-label="Align left"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={block.alignment === "center"}
                    onPressedChange={() =>
                      updateBlock(index, { ...block, alignment: "center" })
                    }
                    aria-label="Align center"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={block.alignment === "right"}
                    onPressedChange={() =>
                      updateBlock(index, { ...block, alignment: "right" })
                    }
                    aria-label="Align right"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Toggle>
                </div>
                <div className="relative w-full aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${block.videoId}`}
                    title={block.title || "YouTube video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full rounded-lg border"
                  />
                </div>
                <Input
                  placeholder="Video title (optional)"
                  value={block.title || ""}
                  onChange={(e) =>
                    updateBlock(index, { ...block, title: e.target.value })
                  }
                />
              </div>
            )}
          </div>
        </div>
      ))}

      <Dialog open={isYoutubeDialogOpen} onOpenChange={setIsYoutubeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add YouTube Video</DialogTitle>
            <DialogDescription>
              Enter the YouTube video URL to embed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsYoutubeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleYoutubeSubmit}>
              Add Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => addBlock("cta", e)}
          type="button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add CTA
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => addBlock("youtube", e)}
          type="button"
        >
          <Plus className="mr-2 h-4 w-4" />
          <Youtube className="h-4 w-4" />
          Add YouTube
        </Button>
      </div>
    </div>
  );
}