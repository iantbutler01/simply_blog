import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Eye, Share2 } from "lucide-react";
import { Link } from "wouter";
import { type Post } from "@shared/schema";
import { format } from "date-fns";

interface PostCardProps {
  post: Post;
  isAdmin?: boolean;
}

export function PostCard({ post, isAdmin }: PostCardProps) {
  console.log('PostCard socialImageId:', post.socialImageId); // Add logging
  return (
    <Card className="hover:shadow-lg transition-all duration-300 group overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {post.socialImageId && (
          <div className="md:w-1/3 relative">
            <Link href={`/blog/${post.id}`}>
              <img
                src={`/uploads/${post.socialImageId}`}
                alt={post.title}
                className="w-full h-48 md:h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
          </div>
        )}
        <div className={`flex-1 p-6 ${!post.socialImageId ? 'md:p-6' : 'md:p-8'}`}>
          <div className="space-y-4">
            <Link href={`/blog/${post.id}`}>
              <h2 className="text-2xl font-bold group-hover:text-primary transition-colors cursor-pointer">
                {post.title}
              </h2>
            </Link>

            <div className="flex items-center gap-4 text-muted-foreground text-sm">
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
              {post.isDraft && (
                <Badge variant="secondary">
                  Draft
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed line-clamp-2">
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

            {/* Analytics section - only shown in admin view */}
            {isAdmin && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4 mt-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{post.views} views</span>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  <span>{post.shareCount} shares</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}