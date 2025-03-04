import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/components/blog/PostCard";
import { useState } from "react";
import { type Post } from "@shared/schema";
import { PenSquare } from "lucide-react";

export default function BlogIndex() {
  const [search, setSearch] = useState("");

  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", search],
    queryFn: async () => {
      const url = new URL("/api/posts", window.location.origin);
      if (search) url.searchParams.set("search", search);
      // Only show published posts
      url.searchParams.set("published", "true");
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  return (
    <div className="container py-8 max-w-4xl mx-auto px-4">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Latest Posts
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover interesting articles and insights
          </p>
        </div>

        <Input
          type="search"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse bg-muted rounded-lg"
              />
            ))}
          </div>
        ) : posts?.length === 0 ? (
          <div className="text-center py-12">
            <PenSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h2 className="mt-4 text-xl font-semibold">No posts found</h2>
            <p className="text-muted-foreground mt-2">
              {search
                ? "Try adjusting your search terms"
                : "Check back later for new posts"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts?.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}