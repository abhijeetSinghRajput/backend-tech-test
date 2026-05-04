import Image from "next/image";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";

import { extractAlgoliaSnippet } from "@/lib/search-utils";
import type { Blog } from "@/types";
import { SanityImage } from "./elements/sanity-image";

type AlgoliaHighlight = {
  value: string;
  matchLevel: string;
};

type AlgoliaHighlightResult = {
  title?: AlgoliaHighlight;
  excerpt?: AlgoliaHighlight;
  body?: AlgoliaHighlight;
};

type BlogImageProps = {
  image: Blog["image"];
  ogImage?: string | null;
  title?: string | null;
  className?: string;
};

export function BlogImage({
  image,
  ogImage,
  title,
  className,
}: BlogImageProps) {
  const containerClasses = cn(
    "relative bg-muted overflow-hidden flex items-center justify-center border-b border-border aspect-square sm:aspect-[4/3]",
    className
  );

  if (!image?.id && ogImage) {
    return (
      <div className={containerClasses}>
        <Image
          src={ogImage}
          alt={title ?? "Blog post image"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  if (!image?.id) {
    return (
      <div className={cn(containerClasses, "p-8")}>
        <div className="relative text-3xl font-black tracking-tight lg:text-5xl select-none opacity-30">
          <span className="bg-gradient-to-b from-foreground/40 to-transparent bg-clip-text text-transparent block truncate max-w-[280px] sm:max-w-[350px] text-center">
            {title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <SanityImage
        alt={title ?? "Blog post image"}
        className="w-full h-full object-cover object-center !rounded-none transition-transform duration-500 group-hover:scale-105"
        height={600}
        image={image}
        width={800}
      />
    </div>
  );
}

type AuthorImageProps = {
  author: Blog["authors"];
};

function AuthorImage({ author }: AuthorImageProps) {
  if (!author?.image) {
    return <div className="size-8 flex-none rounded-full bg-muted" />;
  }

  return (
    <div className="size-8 flex-none rounded-full overflow-hidden bg-muted border border-border">
      <SanityImage
        alt={author.name ?? "Author image"}
        className="w-full h-full object-cover"
        height={128}
        image={author.image}
        width={128}
      />
    </div>
  );
}

type BlogAuthorProps = {
  author: Blog["authors"];
};

export function BlogAuthor({ author }: BlogAuthorProps) {
  if (!author) {
    return null;
  }

  return (
    <div className="flex items-center gap-x-3 text-xs text-muted-foreground relative z-10">
      <AuthorImage author={author} />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground leading-tight">
          {author.name}
        </span>
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
          Author
        </span>
      </div>
    </div>
  );
}

type BlogCardProps = {
  blog: Blog;
  searchQuery?: string;
};

function BlogMeta({
  publishedAt,
  readTime,
}: {
  publishedAt: string | null;
  readTime?: number | null;
}) {
  return (
    <div className="mb-4 mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
      <span>
        {readTime && readTime > 0 ? `${readTime} MIN READ` : "1 MIN READ"}
      </span>
      <span>•</span>
      <time dateTime={publishedAt ?? ""}>
        {publishedAt
          ? new Date(publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : ""}
      </time>
    </div>
  );
}

function getDisplayDescription(
  searchQuery: string | undefined,
  highlightResult: AlgoliaHighlightResult | undefined,
  description: string | null,
  blog: Blog | undefined
) {
  if (searchQuery) {
    if (
      highlightResult?.body?.matchLevel !== "none" &&
      highlightResult?.body?.value
    ) {
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: extractAlgoliaSnippet(highlightResult.body.value),
          }}
        />
      );
    }
    if (
      highlightResult?.excerpt?.matchLevel !== "none" &&
      highlightResult?.excerpt?.value
    ) {
      return (
        <span
          dangerouslySetInnerHTML={{ __html: highlightResult.excerpt.value }}
        />
      );
    }
    return (blog as { excerpt?: string | null })?.excerpt || description;
  }
  return description || (blog as { excerpt?: string | null })?.excerpt;
}

function BlogContent({
  title,
  slug,
  description,
  isFeatured,
  author,
  categories,
  highlightResult,
  searchQuery,
  blog,
}: {
  title: string | null;
  slug: string | null;
  description: string | null;
  isFeatured?: boolean;
  author?: Blog["authors"];
  categories?: Blog["categories"];
  highlightResult?: AlgoliaHighlightResult;
  searchQuery?: string;
  blog?: Blog;
}) {
  const HeadingTag = isFeatured ? "h2" : "h3";
  const headingClasses = isFeatured
    ? "text-3xl font-bold leading-tight mb-4 group-hover:text-primary transition-colors"
    : "text-xl font-bold leading-snug mb-3 group-hover:text-primary transition-colors";

  // Title: use Algolia highlight when a match exists, otherwise plain title
  const displayTitle =
    searchQuery && highlightResult?.title?.matchLevel !== "none" && highlightResult?.title?.value ? (
      <span
        dangerouslySetInnerHTML={{ __html: highlightResult.title.value }}
      />
    ) : (
      title
    );

  const displayDescription = getDisplayDescription(
    searchQuery,
    highlightResult,
    description,
    blog
  );

  return (
    <div className="group relative flex-1">
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 relative z-20">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/blog?category=${cat.slug}`}
              className="text-[10px] font-mono tracking-widest text-primary hover:underline uppercase"
            >
              {cat.title}
            </Link>
          ))}
        </div>
      )}
      <HeadingTag className={headingClasses}>
        <Link href={slug ?? "#"} className="hover:underline">
          <span className="absolute inset-0" />
          {displayTitle}
        </Link>
      </HeadingTag>
      <p
        className={cn(
          "text-muted-foreground text-sm leading-relaxed mb-6",
          !searchQuery && "line-clamp-3"
        )}
      >
        {displayDescription}
      </p>
      {author && <BlogAuthor author={author} />}
    </div>
  );
}

export function FeaturedBlogCard({ blog, searchQuery }: BlogCardProps) {
  const {
    title,
    publishedAt,
    slug,
    description,
    image,
    ogImage,
    authors,
    readTime,
    categories,
  } = blog ?? {};
  const author = authors;

  return (
    <article className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
      <BlogImage
        image={image}
        ogImage={ogImage}
        title={title}
        className="rounded-none border border-border"
      />
      <div className="space-y-6">
        <BlogMeta publishedAt={publishedAt} readTime={readTime as number | null} />
        <BlogContent
          description={description}
          isFeatured
          slug={slug}
          title={title}
          author={author}
          categories={categories as Blog["categories"]}
          highlightResult={(blog as unknown as { _highlightResult?: AlgoliaHighlightResult })._highlightResult}
          searchQuery={searchQuery}
          blog={blog}
        />
      </div>
    </article>
  );
}

export function BlogCard({ blog, searchQuery }: BlogCardProps) {
  if (!blog) {
    return (
      <article className="flex w-full flex-col border border-border bg-background overflow-hidden">
        <div className="flex justify-end p-4 border-b border-border">
          <div className="h-4 w-24 animate-pulse bg-muted" />
        </div>
        <div className="aspect-square sm:aspect-[4/3] animate-pulse bg-muted" />
        <div className="flex flex-col flex-1 p-6">
          <div className="space-y-4">
            <div className="h-3 w-32 animate-pulse bg-muted" />
            <div className="h-6 w-full animate-pulse bg-muted" />
            <div className="h-4 w-3/4 animate-pulse bg-muted" />
          </div>
        </div>
      </article>
    );
  }


  
  const {
    title,
    publishedAt,
    slug,
    description,
    image,
    ogImage,
    authors,
    readTime,
    categories,
  } = blog;
  const author = authors;

  return (
    <article className="group flex w-full flex-col border border-border bg-background hover:bg-muted/30 transition-all duration-300 overflow-hidden rounded-none">
      <div className="flex justify-end p-4 border-b border-border">
        <Link
          href={slug ?? "#"}
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group/link"
        >
          <span>Read blog post</span>
          <span className="flex size-5 items-center justify-center rounded-none border border-border group-hover/link:border-primary transition-colors">
            <svg
              aria-label="Arrow"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform"
            >
              <path d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
          </span>
        </Link>
      </div>
      <Link href={slug ?? "#"} className="block overflow-hidden rounded-none">
        <BlogImage
          image={image}
          ogImage={ogImage}
          title={title}
          className="rounded-none"
        />
      </Link>
      <div className="flex flex-col flex-1 p-6">
        <BlogMeta publishedAt={publishedAt} readTime={readTime as number | null} />
        <BlogContent
          description={description}
          slug={slug}
          title={title}
          author={author}
          categories={categories as Blog["categories"]}
          highlightResult={(blog as unknown as { _highlightResult?: AlgoliaHighlightResult })._highlightResult}
          searchQuery={searchQuery}
          blog={blog}
        />
      </div>
    </article>
  );
}

export function BlogHeader({
  title,
  description,
}: {
  title: string | null;
  description: string | null;
}) {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-bold text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-8">
          {description}
        </p>
      </div>
    </div>
  );
}
