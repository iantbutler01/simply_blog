import { useState } from "react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ImageUpload } from "@/components/blog/ImageUpload";
import { SocialPreview } from "@/components/blog/SocialPreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TimePickerInput } from "@/components/ui/time-picker";

type FormValues = {
  title: string;
  content: Block[];
  excerpt: string;
  tags: string[];
  isDraft: boolean;
  publishAt: Date | null;
  metaTitle: string;
  metaDescription: string;
  socialImageId: string;
  canonicalUrl: string;
};

export default function EditPost() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const postId = new URLSearchParams(search).get("id");
  const [selectedTime, setSelectedTime] = useState<string>("12:00");

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
      publishAt: null,
      metaTitle: "",
      metaDescription: "",
      socialImageId: "",
      canonicalUrl: "",
    },
  });

  // Update form when post data is loaded
  useEffect(() => {
    if (post) {
      const publishDate = post.publishAt ? new Date(post.publishAt) : null;
      if (publishDate) {
        setSelectedTime(format(publishDate, "HH:mm"));
      }

      form.reset({
        title: post.title,
        content: Array.isArray(post.content) ? post.content : [{ type: "text", content: post.content as string, format: "html" }],
        excerpt: post.excerpt,
        tags: post.tags,
        isDraft: post.isDraft,
        publishAt: publishDate,
        metaTitle: post.metaTitle || "",
        metaDescription: post.metaDescription || "",
        socialImageId: post.socialImageId || "",
        canonicalUrl: post.canonicalUrl || "",
      });
    }
  }, [post, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Combine date and time for publishAt if both are set
      let publishAt = values.publishAt;
      if (publishAt && !values.isDraft) {
        const timeparts = selectedTime.split(":");
        publishAt = new Date(publishAt);
        publishAt.setHours(parseInt(timeparts[0], 10));
        publishAt.setMinutes(parseInt(timeparts[1], 10));
      } else {
        publishAt = null;
      }

      const formattedValues = {
        ...values,
        publishAt,
        canonicalUrl: values.canonicalUrl || null,
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
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });

      if (postId) {
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
      }

      toast({
        title: "Success",
        description: `Post ${postId ? "updated" : "created"} successfully.`,
      });

      if (!postId) {
        navigate("/admin/posts");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">
        {postId ? "Edit Post" : "New Post"}
      </h1>

      <ResizablePanelGroup direction="horizontal" className="min-h-[800px] rounded-lg border">
        <ResizablePanel defaultSize={50}>
          <div className="p-8 h-full overflow-auto">
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

                <div className="space-y-4 rounded-lg border p-4">
                  <FormField
                    control={form.control}
                    name="isDraft"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Draft</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Keep this post as a draft
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

                  {!form.watch("isDraft") && (
                    <FormField
                      control={form.control}
                      name="publishAt"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Schedule Publication</FormLabel>
                          <div className="flex gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-[240px] pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <TimePickerInput
                              value={selectedTime}
                              onChange={setSelectedTime}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value="seo">
                    <AccordionTrigger>SEO Settings</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="metaTitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Meta Title</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Custom title for search engines" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="metaDescription"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Meta Description</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Brief description for search results (max 160 characters)" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="socialImageId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Social Share Image</FormLabel>
                                <FormControl>
                                  <div className="flex items-center gap-4">
                                    <ImageUpload
                                      onUpload={(url) => {
                                        const id = url.split('/').pop() || '';
                                        field.onChange(id);
                                      }}
                                    />
                                    {field.value && (
                                      <img
                                        src={`/uploads/${field.value}`}
                                        alt="Social preview"
                                        className="h-20 w-20 object-cover rounded-lg"
                                      />
                                    )}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="canonicalUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Canonical URL</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="https://example.com/original-article" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="lg:border-l lg:pl-6">
                          <h3 className="font-medium mb-4">Social Preview</h3>
                          <SocialPreview
                            title={form.watch("metaTitle") || form.watch("title")}
                            description={form.watch("metaDescription") || form.watch("excerpt")}
                            imageUrl={form.watch("socialImageId") ? `/uploads/${form.watch("socialImageId")}` : undefined}
                            url={form.watch("canonicalUrl") || window.location.origin}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

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
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50}>
          <div className="p-8 h-full overflow-auto">
            <div className="prose prose-lg max-w-none min-w-[500px]">
              <h1 className="text-4xl font-bold mb-4">{form.watch("title")}</h1>

              <div className="flex items-center gap-4 mb-8 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <time dateTime={new Date().toISOString()}>
                    {format(new Date(), "MMMM d, yyyy")}
                  </time>
                </div>
                <div className="flex gap-2">
                  {form.watch("tags").map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                {form.watch("content").map((block, index) => {
                  if (block.type === "text") {
                    return (
                      <div
                        key={index}
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: block.content }}
                      />
                    );
                  } else if (block.type === "image" && block.imageId) {
                    return (
                      <figure key={index} className="my-8">
                        <img
                          src={`/uploads/${block.imageId}`}
                          alt={block.alt || ""}
                          className="rounded-lg w-full"
                        />
                        {block.caption && (
                          <figcaption className="mt-2 text-sm text-muted-foreground text-center">
                            {block.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}