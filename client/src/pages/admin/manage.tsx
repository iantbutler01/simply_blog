import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Share2,
  MessageSquare,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/lib/theme-provider";
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
import { z } from "zod";
import { useEffect } from "react";
import { Switch } from "@/components/ui/switch";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function AdminManage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme, updateTheme } = useTheme();

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
      themePrimary: theme.primary,
      themeVariant: theme.variant,
      themeAppearance: theme.appearance,
      themeRadius: theme.radius,
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        blogName: settings.blogName,
        blogDescription: settings.blogDescription,
        themePrimary: settings.themePrimary,
        themeVariant: settings.themeVariant,
        themeAppearance: settings.themeAppearance,
        themeRadius: settings.themeRadius,
      });
    }
  }, [settings, form]);

  const settingsMutation = useMutation({
    mutationFn: async (values) => {
      // First update the database
      const response = await apiRequest("PATCH", "/api/settings", values);

      // Then update the theme context
      updateTheme({
        primary: values.themePrimary,
        variant: values.themeVariant,
        appearance: values.themeAppearance,
        radius: values.themeRadius,
      });

      return response;
    },
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

  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const res = await apiRequest("POST", "/api/auth/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password updated successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
    onError: (error: Error) => {
      toast({
        title: "Failed to delete post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/reset-to-default");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password has been reset to default.",
      });
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
            <AccordionTrigger className="text-xl font-semibold">
              Blog Settings
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) =>
                    settingsMutation.mutate(data),
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="blogName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blog Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your blog name"
                          />
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
                          <Input
                            {...field}
                            placeholder="Enter a brief description of your blog"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">Theme Settings</h3>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="themePrimary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  {...field}
                                  className="w-12 h-10 p-1"
                                />
                                <Input
                                  type="text"
                                  value={field.value}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  placeholder="#000000"
                                  className="flex-1"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeVariant"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme Variant</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a theme variant" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="professional">
                                  Professional
                                </SelectItem>
                                <SelectItem value="tint">Tint</SelectItem>
                                <SelectItem value="vibrant">Vibrant</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeAppearance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme Appearance</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select appearance mode" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeRadius"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Border Radius</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-4">
                                <Slider
                                  min={0}
                                  max={20}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={([value]) =>
                                    field.onChange(value)
                                  }
                                  className="flex-1"
                                />
                                <span className="w-12 text-right">
                                  {field.value}px
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={settingsMutation.isPending}>
                    {settingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </form>
              </Form>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="security">
            <AccordionTrigger className="text-xl font-semibold">
              Security Settings
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit((data) =>
                    passwordMutation.mutate(data),
                  )}
                  className="space-y-6"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your current password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your new password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Confirm your new password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={passwordMutation.isPending}
                    className="w-full"
                  >
                    {passwordMutation.isPending
                      ? "Updating..."
                      : "Update Password"}
                  </Button>
                </form>
              </Form>
              <div className="mt-4 pt-4 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Reset to Default Password
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Reset to Default Password
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset your password to the default value. Are
                        you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => resetPasswordMutation.mutate()}
                        disabled={resetPasswordMutation.isPending}
                      >
                        {resetPasswordMutation.isPending
                          ? "Resetting..."
                          : "Reset Password"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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
                  <TableHead>Comments</TableHead>
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
                        <div
                          className="flex items-center gap-1"
                          title="Reading time"
                        >
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
                      <Switch
                        checked={!post.commentsDisabled}
                        className="data-[state=checked]:bg-accent"
                        onCheckedChange={async (enabled) => {
                          try {
                            await apiRequest("PATCH", `/api/posts/${post.id}`, {
                              commentsDisabled: !enabled,
                            });
                            queryClient.invalidateQueries({
                              queryKey: ["/api/posts"],
                            });
                            queryClient.invalidateQueries({
                              queryKey: [`/api/posts/${post.id}`],
                            });
                            toast({
                              title: "Success",
                              description: `Comments ${enabled ? "enabled" : "disabled"} for this post.`,
                            });
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to update comment settings",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                      <span className="text-center text-sm text-muted-foreground">
                        {!post.commentsDisabled ? "Enabled" : "Disabled"}
                      </span>
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
                                Are you sure you want to delete this post? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  try {
                                    await deleteMutation.mutateAsync(post.id);
                                  } catch (error) {
                                    // Error is handled in onError
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending
                                  ? "Deleting..."
                                  : "Delete"}
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
