import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { type Block } from "@shared/schema";

interface CTABlockEditorProps {
  block: Block & { type: "cta" };
  onChange: (block: Block) => void;
  onRemove: () => void;
}

export function CTABlockEditor({ block, onChange, onRemove }: CTABlockEditorProps) {
  return (
    <Card className="relative">
      <CardContent className="space-y-4 pt-6">
        <Textarea
          placeholder="Enter your call-to-action text..."
          value={block.content}
          onChange={(e) =>
            onChange({ ...block, content: e.target.value })
          }
          className="min-h-[100px]"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="Button text"
            value={block.buttonText}
            onChange={(e) =>
              onChange({ ...block, buttonText: e.target.value })
            }
          />
          <Input
            placeholder="Button URL (https://...)"
            value={block.buttonUrl}
            onChange={(e) =>
              onChange({ ...block, buttonUrl: e.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              value={block.buttonVariant}
              onValueChange={(value) =>
                onChange({
                  ...block,
                  buttonVariant: value as "default" | "outline" | "secondary",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Button style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={block.alignment}
              onValueChange={(value) =>
                onChange({
                  ...block,
                  alignment: value as "left" | "center" | "right",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" size="sm" onClick={onRemove}>
          Remove
        </Button>
        <div className="flex items-center text-sm text-muted-foreground">
          CTA Block
        </div>
      </CardFooter>
    </Card>
  );
}
