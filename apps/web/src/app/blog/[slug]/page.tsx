import { Logger } from "@workspace/logger";
import { client, urlFor } from "@workspace/sanity/client";
import { sanityFetch } from "@workspace/sanity/live";
import { queryBlogPaths, queryBlogSlugPageData } from "@workspace/sanity/query";
import { cache } from "react";
import { notFound } from "next/navigation";

import { BlogImage } from "@/components/blog-card";
import { Breadcrumbs } from "@/components/elements/breadcrumbs";
import { Joint, VerticalLine } from "@/components/elements/grid-ui";
import { RichText } from "@/components/elements/rich-text";
import { SanityImage } from "@/components/elements/sanity-image";
import { TableOfContent } from "@/components/elements/table-of-content";
import { ArticleJsonLd } from "@/components/json-ld";
import { getSEOMetadata } from "@/lib/seo";
import { PokemonHero, type Pokemon } from "@/components/elements/pokemon-hero";

const logger = new Logger("BlogSlug");

const fetchBlogSlugPageData = cache(async (slug: string) => {
  const maxRetries = 3;
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await sanityFetch({
        query: queryBlogSlugPageData,
        params: { slug },
      });
    } catch (err) {
      lastError = err;
      logger.warn(`Retry ${i + 1}/${maxRetries} for slug: ${slug} due to error: ${err instanceof Error ? err.message : String(err)}`);
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw lastError;
});

async function fetchBlogPaths() {
  const maxRetries = 3;
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const slugs = await client.fetch(queryBlogPaths);

      // If no slugs found, return empty array to prevent build errors
      if (!Array.isArray(slugs) || slugs.length === 0) {
        return [];
      }

      return slugs
        .filter((s): s is string => typeof s === "string" && s.length > 0)
        .map((s) => {
          const slug = s.split("/").filter(Boolean).pop() || s;
          return { slug };
        });
    } catch (error) {
      lastError = error;
      logger.warn(`Retry ${i + 1}/${maxRetries} for blog paths due to error: ${error instanceof Error ? error.message : String(error)}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  logger.error("Error fetching blog paths after all retries", lastError);
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await fetchBlogSlugPageData(slug);
  const slugString = `/blog/${slug}`;

  let imageUrl: string | undefined;
  if (data?.seoImage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imageUrl = urlFor(data.seoImage as any).url();
  } else if (data?.ogImage) {
    imageUrl = data.ogImage as string;
  } else if (data?.image) {
    imageUrl = urlFor(data.image).url();
  }

  return getSEOMetadata({
    title: data?.seoTitle ?? data?.title,
    description: data?.seoDescription ?? data?.description,
    image: imageUrl,
    slug: slugString,
    contentId: data?._id,
    contentType: data?._type,
    pageType: "article",
  });
}

export async function generateStaticParams() {
  const paths = await fetchBlogPaths();
  return paths;
}

// Allow dynamic params for paths not generated at build time
export const dynamicParams = true;

export default async function BlogSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await fetchBlogSlugPageData(slug);
  if (!data) {
    return notFound();
  }
  const { title, description, image, ogImage, richText, readTime } = data ?? {};
  const author = data?.authors;

  return (
    <div className="bg-background min-h-screen text-foreground">
      {/* Sticky Breadcrumbs Section */}
      <div className="sticky top-0 z-[40] bg-background/80 backdrop-blur-md border-b border-border relative">
        <div className="container mx-auto px-4 md:px-8 max-w-[1400px] relative py-4">
          <VerticalLine className="left-0 md:left-8" />
          <VerticalLine className="right-0 md:right-8" />
          <Breadcrumbs
            className="mb-0"
            items={[
              { label: "HOME", href: "/" },
              { label: "BLOG", href: "/blog" },
              { label: title?.toUpperCase() || "POST", active: true },
            ]}
          />
          <Joint position="bottom-left" className="left-0  hidden md:block md:ml-8" />
          <Joint position="bottom-right" className="right-0  hidden md:block md:mr-8" />
        </div>
      </div>

      {/* Hero Section */}
      <header className="border-b border-border relative">
        <div className="container mx-auto px-4 md:px-8 max-w-[1400px] relative">
          <VerticalLine className="left-0 md:left-8" />
          <VerticalLine className="right-0 md:right-8" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center flex px-4 md:px-6 py-16">
            <div className="relative">
              <h1 className="font-bold text-3xl md:text-5xl text-foreground leading-tight mb-6">
                {title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-6">
                <span>
                  PUBLISHED:{" "}
                  {new Date(data?._createdAt || "")
                    .toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    .toUpperCase()}
                </span>
                <span>•</span>
                <span>
                  {readTime && readTime > 0
                    ? `${readTime} MIN READ`
                    : "1 MIN READ"}
                </span>
              </div>

              {description && (
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-xl">
                  {description}
                </p>
              )}

              {author && (
                <div className="flex items-center gap-3 mb-8">
                  {author.image ? (
                    <div className="size-8 flex-none rounded-full overflow-hidden bg-muted border border-border">
                      <SanityImage
                        alt={author.name || "Author"}
                        image={author.image}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-full size-8 bg-muted flex-none border border-border" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {author?.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                      Author
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="relative w-full flex items-center justify-center min-h-[320px]">
              {data.pokemon?.image && data.pokemon?.name && typeof data.pokemon?.id === 'number' ? (
                <PokemonHero pokemon={data.pokemon as Pokemon} />
              ) : (
                <BlogImage
                  image={image}
                  ogImage={ogImage}
                  title={title}
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 md:px-8 max-w-[1400px] py-16">
        <div className="grid grid-cols-1 gap-16 px-4 md:px-6 lg:grid-cols-[1fr_300px]">
          <main>
            <ArticleJsonLd article={data} />
            <RichText richText={richText} />
          </main>

          <div className="hidden lg:block relative">
            <div className="sticky top-20 pl-8 border-l border-border/50">
              <TableOfContent richText={richText ?? []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
