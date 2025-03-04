import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { type Post } from "@shared/schema";
import { Head } from "@/components/blog/Head";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function BlogPost() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  // Silently record view without showing count
  const viewMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${id}/view`);
    },
  });

  const { data: post, isLoading } = useQuery<Post>({
    queryKey: [`/api/posts/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch post");
      const post = await res.json();
      // Redirect if trying to access a draft post directly
      if (post.isDraft && !window.location.pathname.startsWith('/admin')) {
        navigate('/');
        return null;
      }
      // Record view after successful load
      viewMutation.mutate();
      return post;
    },
  });

  if (isLoading) {
    return (
      <div className="container py-8 max-w-4xl">
        <div className="h-96 animate-pulse bg-muted rounded-lg" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="container py-8 max-w-4xl">
      <Head post={post} />

      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

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

      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
}