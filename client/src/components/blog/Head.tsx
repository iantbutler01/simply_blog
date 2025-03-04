import { Helmet } from "react-helmet";
import { type Post } from "@shared/schema";

interface HeadProps {
  post?: Post;
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
}

export function Head({ post, title, description, image, canonicalUrl }: HeadProps) {
  const siteTitle = "My Blog";
  const defaultDescription = "Discover interesting articles and insights";
  
  const pageTitle = post?.metaTitle || post?.title || title;
  const metaDescription = post?.metaDescription || post?.excerpt || description || defaultDescription;
  const socialImage = post?.socialImageId ? `/uploads/${post.socialImageId}` : image;
  const canonical = post?.canonicalUrl || canonicalUrl || window.location.href;

  return (
    <Helmet>
      <title>{pageTitle ? `${pageTitle} | ${siteTitle}` : siteTitle}</title>
      <meta name="description" content={metaDescription} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={pageTitle || siteTitle} />
      <meta property="og:description" content={metaDescription} />
      {socialImage && <meta property="og:image" content={socialImage} />}
      <meta property="og:url" content={canonical} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle || siteTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {socialImage && <meta name="twitter:image" content={socialImage} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
    </Helmet>
  );
}
