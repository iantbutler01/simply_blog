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
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertPostSchema, type Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function EditPost() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const postId = new URLSearchParams(search).get("id");

  const { data: post } = useQuery<Post>({
    queryKey: [`/api/posts/${postId}`],
    enabled: !!postId,
  });

  const form = useForm({
    resolver: zodResolver(insertPostSchema),
    defaultValues: {
      title: post?.title || "",
      content: post?.content || "",
      excerpt: post?.excerpt || "",
      tags: post?.tags || [],
      isDraft: post?.isDraft ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.getValues) => {
      if (postId) {
        await apiRequest("PATCH", `/api/posts/${postId}`, values);
      } else {
        await apiRequest("POST", "/api/posts", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Success",
        description: `Post ${postId ? "updated" : "created"} successfully.`,
      });
      navigate("/admin/posts");
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
                  <RichTextEditor
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
