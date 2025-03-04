import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <Link href={`/blog/${post.id}`}>
          <CardTitle className="text-2xl font-bold hover:text-primary cursor-pointer">
            {post.title}
          </CardTitle>
        </Link>
        <div className="flex items-center text-muted-foreground gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(post.createdAt), "MMMM d, yyyy")}</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{post.excerpt}</p>
        <div className="flex gap-2 flex-wrap">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
