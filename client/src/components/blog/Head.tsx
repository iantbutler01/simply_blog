import { Helmet } from "react-helmet";
import { type Post } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface HeadProps {
   post?: Post;
   title?: string;
   description?: string;
   image?: string;
   canonicalUrl?: string;
}

export function Head({
   post,
   title,
   description,
   image,
   canonicalUrl,
}: HeadProps) {
   const { data: settings } = useQuery({
      queryKey: ["/api/settings"],
   });

   const siteTitle = settings?.blogName || "My Blog";
   const defaultDescription =
      settings?.blogDescription || "Discover interesting articles and insights";
   const keywords = post?.tags.join(",");
   console.log(post?.createdAt);
   const publishDate = post?.createdAt;
   const modifiedDate = post?.createdAt;

   // Format title and description for better social preview
   const pageTitle = (post?.metaTitle || post?.title || title || "").trim();
   const metaDescription = (
      post?.metaDescription ||
      post?.excerpt ||
      description ||
      defaultDescription ||
      ""
   ).trim();

   // Ensure absolute URLs for images
   const socialImage = post?.socialImageId
      ? `${window.location.origin}/api/images/${post.socialImageId}`
      : image;

   const canonical = post?.canonicalUrl || canonicalUrl || window.location.href;

   // Escape special characters for meta tags
   const escapedTitle = pageTitle.replace(/"/g, "&quot;");
   const escapedDescription = metaDescription.replace(/"/g, "&quot;");

   return (
      <Helmet>
         {/* Basic Meta Tags */}
         <title>{pageTitle ? `${pageTitle} | ${siteTitle}` : siteTitle}</title>
         <meta name="description" content={metaDescription} />

         {/* Open Graph / Facebook */}
         <meta property="og:type" content="article" />
         <meta property="og:site_name" content={siteTitle} />
         <meta property="og:title" content={escapedTitle} />
         <meta property="og:description" content={escapedDescription} />
         {socialImage && <meta property="og:image" content={socialImage} />}
         {socialImage && (
            <meta
               property="og:image:alt"
               content={`Image for ${escapedTitle}`}
            />
         )}
         <meta property="og:url" content={canonical} />
         <meta property="og:locale" content="en_US" />

         {/* Twitter */}
         <meta name="twitter:card" content="summary_large_image" />
         <meta name="twitter:title" content={escapedTitle} />
         <meta name="twitter:description" content={escapedDescription} />
         {socialImage && <meta name="twitter:image" content={socialImage} />}
         {socialImage && (
            <meta
               name="twitter:image:alt"
               content={`Image for ${escapedTitle}`}
            />
         )}

         {/* LinkedIn */}
         <meta property="linkedin:title" content={escapedTitle} />
         <meta property="linkedin:description" content={escapedDescription} />
         {socialImage && (
            <meta property="linkedin:image" content={socialImage} />
         )}

         {/* Pinterest */}
         <meta name="pinterest:title" content={escapedTitle} />
         <meta name="pinterest:description" content={escapedDescription} />
         {socialImage && <meta name="pinterest:image" content={socialImage} />}

         {/* WhatsApp */}
         {/* WhatsApp uses the standard OG tags, so no additional tags needed */}

         {/* Additional SEO tags */}
         {publishDate && (
            <meta name="article:published_time" content={publishDate} />
         )}
         {modifiedDate && (
            <meta name="article:modified_time" content={modifiedDate} />
         )}
         {keywords && <meta name="keywords" content={keywords} />}

         {/* Canonical URL */}
         <link rel="canonical" href={canonical} />
      </Helmet>
   );
}
