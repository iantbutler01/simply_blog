import { type Block } from "@shared/schema";
import { CTABlock } from "./CTABlock";
import { useRef, useState } from "react";

interface BlockRendererProps {
  block: Block;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  switch (block.type) {
    case "text":
      return (
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
    case "image":
      // Handle both single and multiple images
      if (!block.imageId && (!block.imageIds || block.imageIds.length === 0)) return null;

      return (
        <figure className="my-12">
          <div
            className={`flex ${
              block.alignment === "left"
                ? "justify-start"
                : block.alignment === "right"
                ? "justify-end"
                : "justify-center"
            }`}
          >
            <div
              style={{
                width:
                  block.size === "small"
                    ? "300px"
                    : block.size === "medium"
                    ? "500px"
                    : block.size === "large"
                    ? "800px"
                    : "100%",
                maxWidth: "100%",
              }}
            >
              {block.imageId ? (
                // Single image
                <div>
                  <img
                    src={`/api/images/${block.imageId}`}
                    alt={block.alt || ""}
                    className="rounded-lg border w-full h-auto object-contain"
                    style={{ minHeight: "200px" }}
                  />
                  {block.caption && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      {block.caption}
                    </p>
                  )}
                </div>
              ) : block.imageIds && block.imageIds.length > 0 ? (
                // Multiple images
                block.layout === "carousel" ? (
                  <div className="relative overflow-hidden rounded-lg">
                    <div 
                      ref={carouselRef}
                      className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
                    >
                      {block.imageIds.map((imageId, imgIndex) => (
                        <div key={imageId} className="w-full flex-shrink-0 snap-center">
                          <img
                            src={`/api/images/${imageId}`}
                            alt={block.alts?.[imgIndex] || ""}
                            className="w-full h-auto object-contain rounded-lg border"
                            style={{ minHeight: "200px" }}
                          />
                          {block.captions?.[imgIndex] && (
                            <p className="text-sm text-muted-foreground mt-2 text-center">
                              {block.captions[imgIndex]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      {block.imageIds.map((_, i) => (
                        <button
                          key={i}
                          className={`w-2 h-2 rounded-full ${i === activeSlide ? 'bg-primary' : 'bg-muted'}`}
                          aria-label={`Go to slide ${i + 1}`}
                          onClick={() => {
                            if (carouselRef.current) {
                              const slideWidth = carouselRef.current.clientWidth;
                              carouselRef.current.scrollTo({
                                left: i * slideWidth,
                                behavior: 'smooth'
                              });
                              setActiveSlide(i);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`grid gap-4 ${
                      block.layout === "row"
                        ? "grid-flow-col auto-cols-fr"
                        : "grid-flow-row"
                    }`}
                  >
                    {block.imageIds.map((imageId, imgIndex) => (
                      <div key={imageId}>
                        <img
                          src={`/api/images/${imageId}`}
                          alt={block.alts?.[imgIndex] || ""}
                          className="rounded-lg border w-full h-auto object-contain"
                          style={{ minHeight: "200px" }}
                        />
                        {block.captions?.[imgIndex] && (
                          <p className="text-sm text-muted-foreground mt-2 text-center">
                            {block.captions[imgIndex]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : null}
            </div>
          </div>
        </figure>
      );
    case "cta":
      return (
        <div className="my-12">
          <CTABlock block={block} />
        </div>
      );
    case "youtube":
      return (
        <div className="my-12">
          <div className={`${
            block.alignment === "left"
              ? "float-left mr-4 w-1/2"
              : block.alignment === "right"
                ? "float-right ml-4 w-1/2"
                : "w-full"
          }`}>
            <div className="relative w-full aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${block.videoId}`}
                title={block.title || "YouTube video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full rounded-lg border"
              />
            </div>
          </div>
          <div className="clear-both" />
        </div>
      );
    default:
      return null;
  }
}