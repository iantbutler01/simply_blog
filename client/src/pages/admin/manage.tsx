import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Clock, Share2, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { type Post, insertSiteSettingsSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

export default function AdminManage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  const form = useForm({
    resolver: zodResolver(insertSiteSettingsSchema),
    defaultValues: {
      blogName: "",
      blogDescription: "",
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        blogName: settings.blogName,
        blogDescription: settings.blogDescription,
      });
    }
  }, [settings, form]);

  const settingsMutation = useMutation({
    mutationFn: (values: { blogName: string; blogDescription: string }) => 
      apiRequest("PATCH", "/api/settings", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your blog settings have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post deleted",
        description: "The post has been successfully deleted.",
      });
    },
  });

  return (
    <div className="container py-12 max-w-6xl mx-auto px-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Manage Blog</h1>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/comments">
              <MessageSquare className="mr-2 h-4 w-4" />
              Manage Comments
            </Link>
          </Button>
          <Button onClick={() => navigate("/admin/edit")}>
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <Accordion type="single" collapsible defaultValue="settings">
          <AccordionItem value="settings">
            <AccordionTrigger className="text-xl font-semibold">Blog Settings</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => settingsMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="blogName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blog Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your blog name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="blogDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blog Description</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter a brief description of your blog" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={settingsMutation.isPending}>
                    {settingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </form>
              </Form>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {postsLoading ? (
          <div className="h-48 animate-pulse bg-muted rounded-lg" />
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Posts</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Analytics</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts?.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>
                      {post.isDraft ? (
                        <Badge variant="secondary">Draft</Badge>
                      ) : (
                        <Badge variant="default">Published</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1" title="Views">
                          <Eye className="h-4 w-4" />
                          <span>{post.views}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Reading time">
                          <Clock className="h-4 w-4" />
                          <span>{post.readingTimeMinutes}m</span>
                        </div>
                        <div className="flex items-center gap-1" title="Shares">
                          <Share2 className="h-4 w-4" />
                          <span>{post.shareCount}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(post.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/edit?id=${post.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Post</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this post? This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(post.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}