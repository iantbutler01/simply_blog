import { useQuery, useMutation } from "@tanstack/react-query";
import type { Comment } from "@shared/schema";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommentListProps {
  postId: number;
}

export function CommentList({ postId }: CommentListProps) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/posts/${postId}/comments`],
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      toast({
        title: "Comment deleted",
        description: "The comment has been removed.",
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

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-muted rounded-lg p-4">
          <div className="h-4 w-24 bg-muted-foreground/20 rounded mb-2" />
          <div className="h-12 bg-muted-foreground/20 rounded" />
        </div>
      ))}
    </div>;
  }

  if (!comments?.length) {
    return <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="bg-card rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center justify-between flex-1">
              <span className="font-medium">{comment.authorName}</span>
              <time className="text-sm text-muted-foreground">
                {format(new Date(comment.createdAt), "MMM d, yyyy")}
              </time>
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-4 text-destructive hover:text-destructive"
                onClick={() => deleteMutation.mutate(comment.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-card-foreground">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}