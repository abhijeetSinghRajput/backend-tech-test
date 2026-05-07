import { sanityFetch } from "@workspace/sanity/live";
import {
  queryAllCategories,
  queryBlogIndexPageBlogs,
  queryBlogIndexPageBlogsCount,
  queryBlogIndexPageData,
} from "@workspace/sanity/query";
import { notFound } from "next/navigation";

import { urlFor } from "@workspace/sanity/client";

import { BlogHeader } from "@/components/blog-card";
import { BlogPageContent } from "@/components/blog-page-content";
import { PageBuilder } from "@/components/pagebuilder";
import { getSEOMetadata } from "@/lib/seo";
import {
  calculatePaginationMetadata,
  getBlogPaginationStartEnd,
  handleErrors,
} from "@/utils";

import { cache } from "react";
import { Logger } from "@workspace/logger";

const logger = new Logger("BlogIndex");

const fetchWithRetry = async <T,>(fn: () => Promise<T>, name: string): Promise<T> => {
  const maxRetries = 3;
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      logger.warn(`Retry ${i + 1}/${maxRetries} for ${name} due to error: ${err instanceof Error ? err.message : String(err)}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw lastError;
};

const fetchBlogIndexPageData = cache(async () => {
  return await fetchWithRetry(async () => {
    const res = await sanityFetch({ query: queryBlogIndexPageData });
    return res.data;
  }, "BlogIndexPageData");
});

const fetchBlogIndexPageBlogs = cache(async (
  start: number,
  end: number,
  category?: string
) => {
  return await fetchWithRetry(async () => {
    const res = await sanityFetch({
      query: queryBlogIndexPageBlogs,
      params: { start, end, category: category || null },
    });
    return res.data;
  }, "BlogIndexPageBlogs");
});

const fetchBlogIndexPageBlogsCount = cache(async (category?: string) => {
  return await fetchWithRetry(async () => {
    const res = await sanityFetch({
      query: queryBlogIndexPageBlogsCount,
      params: { category: category || null },
    });
    return res.data;
  }, "BlogIndexPageBlogsCount");
});

const fetchAllCategories = cache(async () => {
  return await fetchWithRetry(async () => {
    const res = await sanityFetch({
      query: queryAllCategories,
    });
    return res.data;
  }, "AllCategories");
});


export async function generateMetadata() {
  const { data: result } = await sanityFetch({
    query: queryBlogIndexPageData,
  });

  let imageUrl: string | undefined;
  if (result?.seoImage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imageUrl = urlFor(result.seoImage as any).url();
  } else if (result?.ogImage) {
    imageUrl = result.ogImage as string;
  }

  return getSEOMetadata({
    title: result?.seoTitle ?? result?.title ?? undefined,
    description: result?.seoDescription ?? result?.description ?? undefined,
    image: imageUrl,
    slug: "/blog",
    contentId: result?._id,
    contentType: result?._type,
  });
}

type BlogPageProps = {
  searchParams: Promise<{
    page?: string;
    category?: string;
  }>;
};

export default async function BlogIndexPage({ searchParams }: BlogPageProps) {
  const { page, category } = await searchParams;
  const currentPage = page ? Number(page) : 1;

  // Fetch page data and total count in parallel
  const [
    [indexPageData, errIndexPageData],
    [totalCount, errTotalCount],
    [categories, _errCategories],
  ] = await Promise.all([
    handleErrors(fetchBlogIndexPageData()),
    handleErrors(fetchBlogIndexPageBlogsCount(category)),
    handleErrors(fetchAllCategories()),
  ]);

  if (errIndexPageData || !indexPageData) {
    notFound();
  }

  if (errTotalCount || totalCount === null || totalCount === undefined) {
    return (
      <main className="container mx-auto my-16 px-4 md:px-6">
        <BlogHeader
          description={indexPageData.description}
          title={indexPageData.title}
        />
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Unable to load blog posts at the moment.
          </p>
        </div>
        {indexPageData.pageBuilder && indexPageData.pageBuilder.length > 0 && (
          <PageBuilder
            id={indexPageData._id}
            pageBuilder={indexPageData.pageBuilder}
            type={indexPageData._type}
          />
        )}
      </main>
    );
  }

  const featuredBlogsCount = indexPageData.displayFeaturedBlogs
    ? Number(indexPageData.featuredBlogsCount) || 0
    : 0;

  const paginationMetadata = calculatePaginationMetadata(
    totalCount,
    currentPage
  );

  const { start, end } = getBlogPaginationStartEnd(currentPage);
  const blogStart = currentPage === 1 ? 0 : start + featuredBlogsCount;
  const blogEnd = end + featuredBlogsCount;

  const [blogs, errBlogs] = await handleErrors(
    fetchBlogIndexPageBlogs(blogStart, blogEnd, category)
  );

  if (errBlogs || !blogs) {
    return (
      <main className="container mx-auto my-16 px-4 md:px-6">
        <BlogHeader
          description={indexPageData.description}
          title={indexPageData.title}
        />
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No blog posts available at the moment.
          </p>
        </div>
        {indexPageData.pageBuilder && indexPageData.pageBuilder.length > 0 && (
          <PageBuilder
            id={indexPageData._id}
            pageBuilder={indexPageData.pageBuilder}
            type={indexPageData._type}
          />
        )}
      </main>
    );
  }

  return (
    <BlogPageContent
      blogs={blogs}
      indexPageData={indexPageData}
      paginationMetadata={paginationMetadata}
      categories={categories || []}
    />
  );
}
