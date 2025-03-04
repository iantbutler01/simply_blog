import { Textarea } from "@/components/ui/textarea";
import { useCallback } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <Textarea
      value={value}
      onChange={handleChange}
      className="min-h-[400px] font-mono"
      placeholder="Write your post content here..."
    />
  );
}
