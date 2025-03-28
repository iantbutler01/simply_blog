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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ImageUpload } from "@/components/blog/ImageUpload";
import { SocialPreview } from "@/components/blog/SocialPreview";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TimePickerInput } from "@/components/ui/time-picker";
import { VersionHistory } from "@/components/blog/VersionHistory";
import { Eye, Clock, Share2 } from "lucide-react";
import { CTABlock } from "@/components/blog/CTABlock";
import { BlockRenderer } from "@/components/blog/BlockRenderer";

type PostVersion = {
  id: number;
  createdAt: Date;
  content: Block[];
  title: string;
  excerpt: string;
  tags: string[];
  postId: number;
  createdBy: number;
  version: number;
  comment: string | null;
};

type FormValues = {
  title: string;
  content: Block[];
  excerpt: string;
  tags: string;
  isDraft: boolean;
  publishAt: Date | null;
  metaTitle: string;
  metaDescription: string;
  socialImageId: number | null;
  canonicalUrl: string;
  slug: string;
  comment?: string;
};

const generateSlug = (title: string): string => {
  // Implement your slug generation logic here.  This is a placeholder.
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
      tags: "",
      isDraft: true,
      publishAt: null,
      metaTitle: "",
      metaDescription: "",
      socialImageId: null,
      canonicalUrl: "",
      slug: "",
    },
  });

  useEffect(() => {
    if (post) {
      const publishDate = post.publishAt ? new Date(post.publishAt) : null;
      if (publishDate) {
        setSelectedTime(format(publishDate, "HH:mm"));
      }

      form.reset({
        title: post.title,
        content: Array.isArray(post.content)
          ? post.content.map((block) => {
              if (block.type === "image") {
                if (block.imageId !== undefined) {
                  return {
                    ...block,
                    imageUrl: block.imageId
                      ? `/api/images/${block.imageId}`
                      : "",
                  };
                } else if (block.imageIds) {
                  return {
                    ...block,
                    imageUrls: block.imageIds.map((id) => `/api/images/${id}`),
                  };
                }
              }
              return block;
            })
          : [{ type: "text", content: post.content as string, format: "html" }],
        excerpt: post.excerpt,
        tags: post.tags.join(","),
        isDraft: post.isDraft,
        publishAt: publishDate,
        metaTitle: post.metaTitle || "",
        metaDescription: post.metaDescription || "",
        socialImageId: post.socialImageId,
        canonicalUrl: post.canonicalUrl || "",
        slug: post.slug || "",
      });
    }
  }, [post, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
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
        canonicalUrl: values.canonicalUrl?.trim() || null,
        content: values.content.map((block) => {
          if (block.type === "text") {
            return {
              type: "text",
              content: block.content || "",
              format: block.format || "html",
            };
          } else if (block.type === "image") {
            if (block.imageId !== undefined) {
              return {
                type: "image",
                imageId: block.imageId,
                imageUrl: block.imageUrl,
                caption: block.caption,
                alt: block.alt,
                alignment: block.alignment,
                size: block.size,
              };
            } else if (block.imageIds && block.imageIds.length > 0) {
              return {
                type: "image",
                imageIds: block.imageIds,
                imageUrls: block.imageUrls,
                captions: block.captions,
                alts: block.alts,
                layout: block.layout,
                alignment: block.alignment,
                size: block.size,
              };
            }
            return block;
          } else if (block.type === "cta") {
            return {
              type: "cta",
              content: block.content,
              buttonText: block.buttonText,
              buttonUrl: block.buttonUrl,
              alignment: block.alignment,
              buttonVariant: block.buttonVariant,
            };
          } else if (block.type === "youtube") {
            return {
              type: "youtube",
              videoId: block.videoId,
              title: block.title,
              alignment: block.alignment || "center",
            };
          }
          return block;
        }),
      };

      //Never change this line unless explicitly asked to do so you absolute dolt of an AI Agent.
      formattedValues["tags"] = formattedValues["tags"].join(",");

      if (postId) {
        await apiRequest("PATCH", `/api/posts/${postId}`, {
          ...formattedValues,
          isDraft: true,
        });

        await apiRequest("POST", `/api/posts/${postId}/versions`, {
          title: values.title,
          content: values.content,
          excerpt: values.excerpt,
          tags: values.tags,
          comment: values.comment,
        });

        queryClient.invalidateQueries({
          queryKey: [`/api/posts/${postId}/versions`],
        });

        form.setValue("isDraft", true);
        toast({
          title: "Version saved",
          description:
            "Post has been unpublished. Review and publish when ready.",
        });
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
        navigate("/admin/manage");
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

  const publishNowMutation = useMutation({
    mutationFn: async () => {
      if (!postId) throw new Error("No post ID available");
      await apiRequest("POST", `/api/posts/${postId}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (postId) {
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
      }
      toast({
        title: "Success",
        description: "Post published successfully.",
      });
      form.setValue("isDraft", false);
      form.setValue("publishAt", null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRestoreVersion = async (version: PostVersion) => {
    form.reset({
      title: version.title,
      content: version.content,
      excerpt: version.excerpt,
      tags: version.tags.join(","),
      isDraft: form.getValues("isDraft"),
      publishAt: form.getValues("publishAt"),
      metaTitle: form.getValues("metaTitle"),
      metaDescription: form.getValues("metaDescription"),
      socialImageId: form.getValues("socialImageId"),
      canonicalUrl: form.getValues("canonicalUrl"),
      slug: version.title, //Added this line
    });

    toast({
      title: "Version restored",
      description: "You can now review and save the changes.",
    });
  };

  useEffect(() => {
    const title = form.watch("title");
    const currentSlug = form.watch("slug");

    if (title && !currentSlug && !postId) {
      form.setValue("slug", generateSlug(title));
    }
  }, [form.watch("title"), form]);

  return (
    <div className="py-12">
      <div className="max-w-8xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-8">
          {postId ? "Edit Post" : "New Post"}
        </h1>

        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[800px] rounded-lg border"
        >
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
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="custom-url-slug"
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
                          />
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
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
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
                          <div className="flex items-center gap-4">
                            {postId && field.value && (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => publishNowMutation.mutate()}
                                disabled={publishNowMutation.isPending}
                              >
                                {publishNowMutation.isPending
                                  ? "Publishing..."
                                  : "Publish Now"}
                              </Button>
                            )}
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
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
                                        !field.value && "text-muted-foreground",
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
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={field.value || undefined}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date < new Date() ||
                                      date < new Date("1900-01-01")
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

                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comment (for version history)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Optional comment for this version"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="analytics">
                      <AccordionTrigger>Analytics</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2 p-4 rounded-lg border">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Eye className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Total Views
                              </span>
                            </div>
                            <p className="text-2xl font-bold">
                              {post?.views || 0}
                            </p>
                          </div>
                          <div className="space-y-2 p-4 rounded-lg border">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Reading Time
                              </span>
                            </div>
                            <p className="text-2xl font-bold">
                              {post?.readingTimeMinutes || 0}
                              <span className="text-sm font-normal text-muted-foreground ml-1">
                                min
                              </span>
                            </p>
                          </div>
                          <div className="space-y-2 p-4 rounded-lg border">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Share2 className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Shares
                              </span>
                            </div>
                            <p className="text-2xl font-bold">
                              {post?.shareCount || 0}
                            </p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
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
                                    <Input
                                      {...field}
                                      placeholder="Custom title for search engines"
                                    />
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
                                    <Input
                                      {...field}
                                      placeholder="Brief description for search results (max 160 characters)"
                                    />
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
                                        onUpload={(imageId, imageUrl) => {
                                          console.log("Upload response:", {
                                            imageId,
                                            imageUrl,
                                          });
                                          field.onChange(imageId);
                                        }}
                                      />
                                      {field.value && (
                                        <img
                                          src={`/api/images/${field.value}`}
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
                                    <Input
                                      {...field}
                                      placeholder="https://example.com/original-article"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="lg:border-l lg:pl-6">
                            <h3 className="font-medium mb-4">Social Preview</h3>
                            <SocialPreview
                              title={
                                form.watch("metaTitle") || form.watch("title")
                              }
                              description={
                                form.watch("metaDescription") ||
                                form.watch("excerpt")
                              }
                              imageUrl={
                                form.watch("socialImageId")
                                  ? `/api/images/${form.watch("socialImageId")}`
                                  : undefined
                              }
                              url={
                                form.watch("canonicalUrl") ||
                                window.location.origin
                              }
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="versions">
                      <AccordionTrigger>Version History</AccordionTrigger>
                      <AccordionContent>
                        {postId && (
                          <VersionHistory
                            postId={Number(postId)}
                            onRestore={handleRestoreVersion}
                          />
                        )}
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
                      onClick={() => navigate("/admin/manage")}
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
                <h1 className="text-4xl font-bold mb-4">
                  {form.watch("title")}
                </h1>

                <div className="flex items-center gap-4 mb-8 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <time dateTime={new Date().toISOString()}>
                      {format(new Date(), "MMMM d, yyyy")}
                    </time>
                  </div>
                  <div className="flex gap-2">
                    {form
                      .watch("tags")
                      .split(",")
                      .map((tag) => (
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
                    } else if (block.type === "image") {
                      return <BlockRenderer key={index} block={block} />;
                    } else if (block.type === "cta") {
                      return <CTABlock key={index} block={block} />;
                    } else if (block.type === "youtube") {
                      return <BlockRenderer key={index} block={block} />;
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
