import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/components/blog/PostCard";
import { useState } from "react";
import { type Post } from "@shared/schema";

export default function BlogIndex() {
  const [search, setSearch] = useState("");

  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", search],
    queryFn: async () => {
      const url = new URL("/api/posts", window.location.origin);
      if (search) url.searchParams.set("search", search);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>
      
      <Input
        type="search"
        placeholder="Search posts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-8"
      />

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse bg-muted rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {posts?.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
