import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { BlockEditor } from "@/components/blog/BlockEditor";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertPostSchema, type Post, type Block } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

type FormValues = {
  title: string;
  content: Block[];
  excerpt: string;
  tags: string[];
  isDraft: boolean;
};

export default function EditPost() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const postId = new URLSearchParams(search).get("id");

  const { data: post } = useQuery<Post>({
    queryKey: [`/api/posts/${postId}`],
    enabled: !!postId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(insertPostSchema),
    defaultValues: {
      title: "",
      content: [{ type: "text", content: "", format: "html" }],
      excerpt: "",
      tags: [],
      isDraft: true,
    },
    mode: "onSubmit", // Only validate on form submission
  });

  // Update form when post data is loaded
  useEffect(() => {
    if (post) {
      // Ensure post.content is treated as Block[]
      const content = Array.isArray(post.content)
        ? post.content
        : [{ type: "text", content: post.content as string, format: "html" }];

      form.reset({
        title: post.title,
        content,
        excerpt: post.excerpt,
        tags: post.tags,
        isDraft: post.isDraft,
      });
    }
  }, [post, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Ensure content is properly formatted as Block[]
      const formattedValues = {
        ...values,
        content: values.content.map(block => {
          if (block.type === "text") {
            return {
              type: "text",
              content: block.content || "",
              format: block.format || "html"
            };
          } else {
            return {
              type: "image",
              imageId: block.imageId,
              caption: block.caption,
              alt: block.alt
            };
          }
        })
      };

      if (postId) {
        await apiRequest("PATCH", `/api/posts/${postId}`, formattedValues);
      } else {
        await apiRequest("POST", "/api/posts", formattedValues);
      }
    },
    onSuccess: () => {
      // Invalidate the posts list query
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });

      // If editing existing post, also invalidate the current post query
      if (postId) {
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
      }

      toast({
        title: "Success",
        description: `Post ${postId ? "updated" : "created"} successfully.`,
      });

      // Only navigate away if this was a new post
      if (!postId) {
        navigate("/admin/posts");
      }
    },
  });

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">
        {postId ? "Edit Post" : "New Post"}
      </h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-8"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Excerpt</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <BlockEditor
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (comma-separated)</FormLabel>
                <FormControl>
                  <Input
                    value={field.value.join(", ")}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isDraft"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Draft</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Keep this post as a draft to prevent it from being published
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full"
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/posts")}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}