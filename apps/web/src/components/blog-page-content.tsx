"use client";

import type {
  QueryAllCategoriesResult,
  QueryBlogIndexPageDataResult,
} from "@workspace/sanity/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { BlogHeader } from "@/components/blog-card";
import { BlogPagination } from "@/components/blog-pagination";
import { BlogSearchResults } from "@/components/blog-search-results";
import { BlogSection } from "@/components/blog-section";
import { Breadcrumbs } from "@/components/elements/breadcrumbs";
import { Joint, VerticalLine } from "@/components/elements/grid-ui";
import { PageBuilder } from "@/components/pagebuilder";
import { useBlogSearch } from "@/hooks/use-blog-search";
import type { Blog } from "@/types";
import type { PaginationMetadata } from "@/utils";
import { SearchInput } from "./blog-search";

type BlogPageContentProps = {
  indexPageData: NonNullable<QueryBlogIndexPageDataResult>;
  blogs: Blog[];
  paginationMetadata: PaginationMetadata;
  categories: QueryAllCategoriesResult;
};

export function BlogPageContent({
  indexPageData,
  blogs,
  paginationMetadata,
  categories,
}: BlogPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentCategory = searchParams.get("category");

  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      // Reset page when filter changes
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  const handleCategoryClick = (categorySlug: string | null) => {
    router.push(`${pathname}?${createQueryString("category", categorySlug)}`, {
      scroll: false,
    });
  };

  const {
    title,
    description,
    pageBuilder = [],
    _id,
    _type,
    featuredBlogsCount,
    displayFeaturedBlogs,
  } = indexPageData;

  const {
    searchQuery,
    setSearchQuery,
    results,
    totalCount,
    isSearching,
    hasQuery,
    error,
  } = useBlogSearch(currentCategory);

  const [sortOption, setSortOption] = useState<
    "newest" | "oldest" | "alphabetical"
  >("newest");

  const validFeaturedBlogsCount = featuredBlogsCount
    ? Number.parseInt(featuredBlogsCount, 10)
    : 0;

  const shouldDisplayFeaturedBlogs =
    displayFeaturedBlogs &&
    validFeaturedBlogsCount > 0 &&
    paginationMetadata.currentPage === 1 &&
    !hasQuery &&
    !currentCategory; // Don't show featured when filtering by category

  const featuredBlogs = shouldDisplayFeaturedBlogs
    ? blogs.slice(0, validFeaturedBlogsCount)
    : [];

  const remainingBlogs = shouldDisplayFeaturedBlogs
    ? blogs.slice(validFeaturedBlogsCount)
    : blogs;

  const sortedRemainingBlogs = useMemo(() => {
    const sorted = [...remainingBlogs];
    if (sortOption === "newest") {
      sorted.sort(
        (a, b) =>
          new Date(b.publishedAt || 0).getTime() -
          new Date(a.publishedAt || 0).getTime()
      );
    } else if (sortOption === "oldest") {
      sorted.sort(
        (a, b) =>
          new Date(a.publishedAt || 0).getTime() -
          new Date(b.publishedAt || 0).getTime()
      );
    } else if (sortOption === "alphabetical") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    return sorted;
  }, [remainingBlogs, sortOption]);

  return (
    <main className="bg-background min-h-screen">
      <div className="border-b border-border relative">
        <div className="container mx-auto px-4 md:px-8 max-w-[1400px] py-4 relative">
          <VerticalLine className="left-0 md:left-8" />
          <VerticalLine className="right-0 md:right-8" />
          <Breadcrumbs
            className="mb-0"
            items={[
              { label: "HOME", href: "/" },
              { label: "BLOG", active: true },
            ]}
          />
          <Joint position="bottom-left" className="left-0 md:left-8" />
          <Joint position="bottom-right" className="right-0 md:right-8" />
        </div>
      </div>

      <div className="container mx-auto mt-16 px-4 md:px-8 max-w-[1400px] relative">
        <VerticalLine className="left-0 md:left-8" />
        <VerticalLine className="right-0 md:right-8" />
        <BlogHeader description={description} title={title} />

        <SearchInput
          className="mt-8 mb-12"
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
          placeholder="Search blogs..."
          value={searchQuery}
        />

        {hasQuery ? (
          <BlogSearchResults
            error={error}
            hasQuery={hasQuery}
            isSearching={isSearching}
            results={results}
            totalCount={totalCount}
            searchQuery={searchQuery}
          />
        ) : (
          <>
            <BlogSection
              blogs={featuredBlogs}
              isFeatured
              title="Featured Posts"
            />

            <div className="border-y bg-background z-30 sticky top-0 border-border flex flex-col md:flex-row items-center justify-between py-3 px-4 mb-0 border-x relative">
              <div className="flex items-center gap-2 overflow-x-auto text-xs font-medium w-full md:w-auto scrollbar-hide">
                <button
                  type="button"
                  onClick={() => handleCategoryClick(null)}
                  className={cn(
                    "px-4 py-1.5 rounded-none border transition-colors whitespace-nowrap",
                    !currentCategory
                      ? "bg-muted text-foreground border-border/50"
                      : "text-muted-foreground hover:text-foreground border-transparent"
                  )}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat._id}
                    onClick={() => handleCategoryClick(cat.slug || null)}
                    className={cn(
                      "px-4 py-1.5 rounded-none border transition-colors whitespace-nowrap",
                      currentCategory === cat.slug
                        ? "bg-muted text-foreground border-border/50"
                        : "text-muted-foreground hover:text-foreground border-transparent"
                    )}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
              <Joint position="top-left" className="left-0" />
              <Joint position="top-right" className="right-0" />
              <Joint position="bottom-left" className="left-0" />
              <Joint position="bottom-right" className="right-0" />
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none" asChild>
                  <div className="flex min-w-32 items-center gap-2 text-xs text-muted-foreground mt-4 md:mt-0 cursor-pointer hover:text-foreground transition-colors">
                    <svg
                      aria-label="Filter"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18M3 12h18M3 18h18" />
                    </svg>
                    <span>
                      {sortOption === "newest" && "Newest first"}
                      {sortOption === "oldest" && "Oldest first"}
                      {sortOption === "alphabetical" && "Alphabetical"}
                    </span>
                    <svg
                      aria-label="Sort"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuRadioGroup
                    value={sortOption}
                    onValueChange={(value) => setSortOption(value as "newest" | "oldest" | "alphabetical")}
                  >
                    <DropdownMenuRadioItem value="newest">
                      Newest first
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="oldest">
                      Oldest first
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="alphabetical">
                      Alphabetical
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <BlogSection blogs={sortedRemainingBlogs} title="All Posts" />
            {paginationMetadata?.totalPages > 1 && (
              <BlogPagination
                className="mt-12 flex justify-center"
                currentPage={paginationMetadata.currentPage}
                hasNextPage={paginationMetadata.hasNextPage}
                hasPreviousPage={paginationMetadata.hasPreviousPage}
                totalPages={paginationMetadata.totalPages}
              />
            )}
          </>
        )}
      </div>

      {pageBuilder && pageBuilder.length > 0 && (
        <PageBuilder id={_id} pageBuilder={pageBuilder} type={_type} />
      )}
    </main>
  );
}
