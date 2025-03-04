import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { Link } from "wouter";
import { type Post } from "@shared/schema";
import { format } from "date-fns";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="space-y-2">
        <Link href={`/blog/${post.id}`}>
          <h2 className="text-2xl font-bold group-hover:text-primary transition-colors cursor-pointer">
            {post.title}
          </h2>
        </Link>
        <div className="flex items-center text-muted-foreground gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          <time dateTime={post.createdAt.toString()}>
            {format(new Date(post.createdAt), "MMMM d, yyyy")}
          </time>
          {post.isDraft && (
            <Badge variant="secondary" className="ml-2">
              Draft
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          {post.excerpt}
        </p>
        <div className="flex gap-2 flex-wrap">
          {post.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="hover:bg-primary/5 transition-colors cursor-default"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}