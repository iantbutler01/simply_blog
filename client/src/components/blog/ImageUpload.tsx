import { Button } from "@/components/ui/button";
import { Image as ImageIcon } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Image } from "@shared/schema";

interface ImageUploadProps {
  onUpload: (url: string) => void;
}

export function ImageUpload({ onUpload }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setIsUploading(true);
    try {
      const res = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to upload image');
      }

      const image: Image = await res.json();
      onUpload(image.url);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
      <Button
        variant="ghost"
        size="sm"
        disabled={isUploading}
        onClick={(e) => {
          e.preventDefault(); // Prevent form submission
          e.stopPropagation(); // Stop event bubbling
          fileInputRef.current?.click();
        }}
        type="button" // Explicitly set type to prevent form submission
      >
        <ImageIcon className={`h-4 w-4 ${isUploading ? 'animate-pulse' : ''}`} />
      </Button>
    </>
  );
}