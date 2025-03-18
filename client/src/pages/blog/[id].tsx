import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { type Post } from "@shared/schema";
import { Head } from "@/components/blog/Head";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CommentForm } from "@/components/blog/CommentForm";
import { CommentList } from "@/components/blog/CommentList";
import { BlockRenderer } from "@/components/blog/BlockRenderer";

export default function BlogPost() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  // First try to load by slug if it looks like a slug (not a number)
  const isSlug = isNaN(Number(id));
  const endpoint = isSlug ? `/api/posts/by-slug/${id}` : `/api/posts/${id}`;

  // Record view without showing count
  const viewMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("POST", `/api/posts/${postId}/view`);
    },
  });

  const { data: post, isLoading: postLoading } = useQuery<Post>({
    queryKey: [endpoint],
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch post");
      const post = await res.json();
      // Redirect if trying to access a draft post directly
      if (post.isDraft && !window.location.pathname.startsWith('/admin')) {
        navigate('/');
        return null;
      }
      // Record view after successful load
      viewMutation.mutate(post.id);
      return post;
    },
  });

  // Only fetch comments if post exists and comments are enabled
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: [`/api/posts/${post?.id}/comments`],
    enabled: Boolean(post) && !post.commentsDisabled,
  });

  if (postLoading) {
    return (
      <div className="container py-12 max-w-3xl mx-auto px-6">
        <div className="h-96 animate-pulse bg-muted rounded-lg" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="container py-12 max-w-3xl mx-auto px-6">
      <Head post={post} />

      <h1 className="text-4xl font-bold mb-6">{post.title}</h1>

      <div className="flex items-center gap-4 mb-8 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <time dateTime={post.createdAt.toString()}>
            {format(new Date(post.createdAt), "MMMM d, yyyy")}
          </time>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{post.readingTimeMinutes} min read</span>
        </div>
      </div>

      <div className="flex gap-2 mb-8">
        {post.tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>

      <article className="prose prose-lg max-w-none space-y-8">
        {post.content.map((block, index) => (
          <BlockRenderer key={index} block={block} />
        ))}
      </article>

      {/* Comments Section - Only show if comments are not disabled */}
      {!post.commentsDisabled && (
        <div className="mt-16 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-8">Comments</h2>
          <CommentList postId={post.id} comments={comments} />
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Leave a Comment</h3>
            <CommentForm postId={post.id} />
          </div>
        </div>
      )}
    </div>
  );
}