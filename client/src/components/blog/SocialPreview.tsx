import { type Post } from "@shared/schema";
import { BsTwitterX, BsFacebook, BsLinkedin } from "react-icons/bs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SocialPreviewProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
}

function TwitterCard({ title, description, imageUrl, url }: SocialPreviewProps) {
  return (
    <div className="w-[500px] rounded-xl border bg-white shadow-lg overflow-hidden">
      {imageUrl && (
        <div className="w-full h-[250px] relative">
          <img
            src={imageUrl}
            alt="Social preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <p className="text-sm text-gray-500 truncate">{url || window.location.origin}</p>
        <h3 className="font-bold text-lg mt-1 line-clamp-2">
          {title || 'Title preview'}
        </h3>
        <p className="text-gray-700 text-sm mt-1 line-clamp-3">
          {description || 'Description preview'}
        </p>
      </div>
    </div>
  );
}

function FacebookCard({ title, description, imageUrl, url }: SocialPreviewProps) {
  return (
    <div className="w-[500px] rounded border bg-white shadow-lg overflow-hidden">
      {imageUrl && (
        <div className="w-full h-[250px] relative">
          <img
            src={imageUrl}
            alt="Social preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {url || window.location.origin}
        </p>
        <h3 className="font-bold text-lg mt-1 line-clamp-2">
          {title || 'Title preview'}
        </h3>
        <p className="text-gray-600 text-sm mt-1 line-clamp-3">
          {description || 'Description preview'}
        </p>
      </div>
    </div>
  );
}

function LinkedInCard({ title, description, imageUrl, url }: SocialPreviewProps) {
  return (
    <div className="w-[500px] rounded border bg-white shadow-lg overflow-hidden">
      {imageUrl && (
        <div className="w-full h-[250px] relative">
          <img
            src={imageUrl}
            alt="Social preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <p className="text-sm text-gray-500">{url || window.location.origin}</p>
        <h3 className="font-bold text-xl mt-1 line-clamp-2">
          {title || 'Title preview'}
        </h3>
        <p className="text-gray-700 text-sm mt-2 line-clamp-3">
          {description || 'Description preview'}
        </p>
      </div>
    </div>
  );
}

export function SocialPreview({ title, description, imageUrl, url }: SocialPreviewProps) {
  console.log('SocialPreview imageUrl:', imageUrl);
  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="twitter">
        <TabsList className="w-full">
          <TabsTrigger value="twitter" className="flex items-center gap-2">
            <BsTwitterX /> Twitter
          </TabsTrigger>
          <TabsTrigger value="facebook" className="flex items-center gap-2">
            <BsFacebook /> Facebook
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="flex items-center gap-2">
            <BsLinkedin /> LinkedIn
          </TabsTrigger>
        </TabsList>
        <ScrollArea className="w-full rounded-md border bg-muted/50 mt-4">
          <div className="p-4">
            <TabsContent value="twitter" className="mt-0">
              <TwitterCard
                title={title}
                description={description}
                imageUrl={imageUrl}
                url={url}
              />
            </TabsContent>
            <TabsContent value="facebook" className="mt-0">
              <FacebookCard
                title={title}
                description={description}
                imageUrl={imageUrl}
                url={url}
              />
            </TabsContent>
            <TabsContent value="linkedin" className="mt-0">
              <LinkedInCard
                title={title}
                description={description}
                imageUrl={imageUrl}
                url={url}
              />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}