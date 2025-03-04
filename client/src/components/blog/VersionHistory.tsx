import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { type PostVersion } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface VersionHistoryProps {
  postId: number;
  onRestore: (version: PostVersion) => void;
}

export function VersionHistory({ postId, onRestore }: VersionHistoryProps) {
  const { data: versions, isLoading } = useQuery<PostVersion[]>({
    queryKey: [`/api/posts/${postId}/versions`],
    enabled: !!postId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!versions?.length) {
    return <p className="text-muted-foreground">No previous versions</p>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {versions.map((version) => (
          <div
            key={version.id}
            className="border rounded-lg p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Version {version.version} - {format(new Date(version.createdAt), "PPp")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRestore(version)}
              >
                Restore
              </Button>
            </div>
            {version.comment && (
              <p className="text-sm">{version.comment}</p>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
