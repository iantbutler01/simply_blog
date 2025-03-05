import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Comment, Post } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, X, Link as LinkIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

interface CommentWithPost extends Comment {
  post?: Post;
}

export default function CommentsPage() {
  const { toast } = useToast();

  // Fetch pending comments and associated posts
  const { data: comments = [], isLoading } = useQuery<CommentWithPost[]>({
    queryKey: ["/api/comments/pending"],
    queryFn: async () => {
      const comments = await (await fetch("/api/comments/pending")).json();
      // Fetch associated posts for each comment
      const commentsWithPosts = await Promise.all(
        comments.map(async (comment: Comment) => {
          const post = await (await fetch(`/api/posts/${comment.postId}`)).json();
          return { ...comment, post };
        })
      );
      return commentsWithPosts;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("POST", `/api/comments/${commentId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments/pending"] });
      toast({
        title: "Success",
        description: "Comment approved",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("POST", `/api/comments/${commentId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments/pending"] });
      toast({
        title: "Success",
        description: "Comment rejected",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Pending Comments</h1>
          <Button variant="outline" asChild>
            <Link href="/admin/manage">
              <LinkIcon className="w-4 h-4 mr-2" />
              Back to Posts
            </Link>
          </Button>
        </div>

        {!comments?.length ? (
          <Card className="p-6">
            <p className="text-muted-foreground text-center">No pending comments to review.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">{comment.authorName}</p>
                    {comment.authorEmail && (
                      <p className="text-sm text-muted-foreground">{comment.authorEmail}</p>
                    )}
                  </div>
                  <time className="text-sm text-muted-foreground">
                    {format(new Date(comment.createdAt), "PPP")}
                  </time>
                </div>

                <div className="mb-4 pb-4 border-b">
                  <p className="text-card-foreground mb-2">{comment.content}</p>
                  {comment.post && (
                    <p className="text-sm text-muted-foreground">
                      On post:{" "}
                      <Link href={`/admin/posts/${comment.post.id}`} className="hover:text-primary">
                        {comment.post.title}
                      </Link>
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => approveMutation.mutate(comment.id)}
                    disabled={approveMutation.isPending}
                    size="sm"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => rejectMutation.mutate(comment.id)}
                    disabled={rejectMutation.isPending}
                    variant="destructive"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}