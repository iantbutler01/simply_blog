import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Comment } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export default function CommentsPage() {
  const { toast } = useToast();
  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/comments/pending"],
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
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!comments?.length) {
    return (
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Pending Comments</h1>
          <p className="text-muted-foreground">No pending comments to review.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Pending Comments</h1>
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">{comment.authorName}</p>
                  <p className="text-sm text-muted-foreground">{comment.authorEmail}</p>
                </div>
                <time className="text-sm text-muted-foreground">
                  {format(new Date(comment.createdAt), "PPP")}
                </time>
              </div>
              <p className="text-card-foreground mb-4">{comment.content}</p>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
