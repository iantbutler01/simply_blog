import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Clock, Share2 } from "lucide-react";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { type Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {Badge} from "@/components/ui/badge"


export default function AdminPosts() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
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
        <h1 className="text-4xl font-bold">Manage Posts</h1>
        <Button onClick={() => navigate("/admin/edit")}>
          <Plus className="mr-2 h-4 w-4" /> New Post
        </Button>
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse bg-muted rounded-lg" />
      ) : (
        <div className="space-y-6">
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
  );
}