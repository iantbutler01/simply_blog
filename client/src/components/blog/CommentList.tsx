import { useQuery } from "@tanstack/react-query";
import type { Comment } from "@shared/schema";
import { format } from "date-fns";

interface CommentListProps {
  postId: number;
}

export function CommentList({ postId }: CommentListProps) {
  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/posts/${postId}/comments`],
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
            <span className="font-medium">{comment.authorName}</span>
            <time className="text-sm text-muted-foreground">
              {format(new Date(comment.createdAt), "MMM d, yyyy")}
            </time>
          </div>
          <p className="text-card-foreground">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
