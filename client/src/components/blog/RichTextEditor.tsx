import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
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
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  Heading2,
  Link as LinkIcon,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight
} from "lucide-react";
import { useState } from 'react';
import { ImageUpload } from "./ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Write your story...",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary hover:underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg',
        },
        addAttributes() {
          return {
            src: {
              default: null
            },
            alt: {
              default: null
            },
            class: {
              default: 'rounded-lg max-w-full mx-auto'
            },
            size: {
              default: 'full',
              rendered: false
            },
            alignment: {
              default: 'center',
              rendered: false
            }
          }
        }
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none min-h-[200px] focus:outline-none'
      }
    }
  });

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Update existing link or create new one
    editor.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl })
      .run();

    setLinkUrl('');
    setIsLinkDialogOpen(false);
  };

  const addImage = (url: string) => {
    if (editor) {
      editor.chain()
        .focus()
        .setImage({ src: url })
        .run();

      onChange(editor.getHTML());
    }
  };

  const setImageSize = (size: 'small' | 'medium' | 'large' | 'full') => {
    const { view } = editor;
    const { tr } = view.state;

    editor.chain().focus().run();

    const node = editor.view.state.selection.$anchor.node();
    if (node && node.type.name === 'image') {
      let className = 'rounded-lg mx-auto ';
      switch (size) {
        case 'small':
          className += 'max-w-sm';
          break;
        case 'medium':
          className += 'max-w-lg';
          break;
        case 'large':
          className += 'max-w-2xl';
          break;
        case 'full':
          className += 'max-w-full';
          break;
      }

      editor.chain()
        .focus()
        .updateAttributes('image', {
          class: className,
          size
        })
        .run();
    }
  };

  const setImageAlignment = (alignment: 'left' | 'center' | 'right') => {
    editor.chain().focus().run();

    const node = editor.view.state.selection.$anchor.node();
    if (node && node.type.name === 'image') {
      let className = 'rounded-lg ';
      switch (alignment) {
        case 'left':
          className += 'mr-auto';
          break;
        case 'center':
          className += 'mx-auto';
          break;
        case 'right':
          className += 'ml-auto';
          break;
      }

      editor.chain()
        .focus()
        .updateAttributes('image', {
          class: className,
          alignment
        })
        .run();
    }
  };

  if (!editor) return null;

  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50 overflow-x-auto">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogTrigger asChild>
            <Toggle
              size="sm"
              pressed={editor.isActive("link")}
              aria-label="Add link"
            >
              <LinkIcon className="h-4 w-4" />
            </Toggle>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Link</DialogTitle>
              <DialogDescription>
                Enter the URL for the link. Leave empty to remove the link.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={setLink}>
                {editor.isActive('link') ? 'Update Link' : 'Add Link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          aria-label="Toggle heading"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Toggle bullet list"
        >
          <List className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Toggle quote"
        >
          <Quote className="h-4 w-4" />
        </Toggle>

        <ImageUpload onUpload={addImage} />

        <Separator orientation="vertical" className="mx-1 h-6" />

        {editor.isActive('image') && (
          <>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Toggle
              size="sm"
              pressed={editor.getAttributes('image').alignment === 'left'}
              onPressedChange={() => setImageAlignment('left')}
              aria-label="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.getAttributes('image').alignment === 'center'}
              onPressedChange={() => setImageAlignment('center')}
              aria-label="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.getAttributes('image').alignment === 'right'}
              onPressedChange={() => setImageAlignment('right')}
              aria-label="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </Toggle>
            <Select
              value={editor.getAttributes('image').size || 'full'}
              onValueChange={(value: 'small' | 'medium' | 'large' | 'full') => setImageSize(value)}
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
          </>
        )}

        <Toggle
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="Undo"
        >
          <Undo className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="Redo"
        >
          <Redo className="h-4 w-4" />
        </Toggle>
      </div>

      <EditorContent
        editor={editor}
        className="p-4 w-full"
      />

      <style>{`
        .ProseMirror {
          min-height: 200px;
          outline: none;
          width: 100%;
          overflow-x: hidden;
          overflow-y: auto;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
          border-radius: 0.5rem;
        }
        .ProseMirror a {
          color: var(--primary);
          text-decoration: none;
          cursor: pointer;
        }
        .ProseMirror a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}