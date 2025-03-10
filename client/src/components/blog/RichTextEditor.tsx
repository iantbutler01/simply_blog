import React from 'react';
import { useEditor, EditorContent, mergeAttributes, Node } from "@tiptap/react";
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
  AlignRight,
  Youtube
} from "lucide-react";
import { useState } from 'react';
import { ImageUpload } from "./ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Custom YouTube extension
const YouTube = Node.create({
  name: 'youtube',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      videoId: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="youtube"]',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          return {
            videoId: element.getAttribute('data-video-id'),
            title: element.getAttribute('data-title'),
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    return ['div', 
      mergeAttributes({
        'data-type': 'youtube',
        'data-video-id': node.attrs.videoId,
        'data-title': node.attrs.title,
        class: 'relative w-full aspect-video my-4',
      }),
      ['iframe', {
        src: `https://www.youtube.com/embed/${node.attrs.videoId}`,
        title: node.attrs.title || 'YouTube video',
        class: 'absolute inset-0 w-full h-full rounded-lg border',
        frameborder: '0',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        allowfullscreen: 'true',
      }],
    ];
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isYoutubeDialogOpen, setIsYoutubeDialogOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

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
      }),
      YouTube,
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

    editor.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl })
      .run();

    setLinkUrl('');
    setIsLinkDialogOpen(false);
  };

  const addYoutubeVideo = () => {
    if (!editor || !youtubeUrl) return;

    const videoId = extractYoutubeVideoId(youtubeUrl);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

    editor.chain()
      .focus()
      .insertContent({
        type: 'youtube',
        attrs: {
          videoId,
          title: `YouTube video (${videoId})`,
        },
      })
      .run();

    setYoutubeUrl('');
    setIsYoutubeDialogOpen(false);
  };

  const extractYoutubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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
    if (!editor) return;

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
    if (!editor) return;

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
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
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

        <Dialog open={isYoutubeDialogOpen} onOpenChange={setIsYoutubeDialogOpen}>
          <DialogTrigger asChild>
            <Toggle
              size="sm"
              aria-label="Add YouTube video"
            >
              <Youtube className="h-4 w-4" />
            </Toggle>
          </DialogTrigger>
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
              <Button onClick={addYoutubeVideo}>
                Add Video
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