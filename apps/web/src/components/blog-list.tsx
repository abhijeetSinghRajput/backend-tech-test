import { BlogCard } from "@/components/blog-card";
import type { Blog } from "@/types";

export type BlogListProps = {
  blogs: Blog[];
  isLoading?: boolean;
  searchQuery?: string;
};

export function BlogList({
  blogs,
  isLoading = false,
  searchQuery,
}: BlogListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <article
            className="grid w-full grid-cols-1 gap-4"
            key={`skeleton-${index.toString()}`}
          >
            <div className="h-48 animate-pulse rounded-none bg-muted" />
            <div className="space-y-4">
              <div className="h-3 w-24 animate-pulse bg-muted" />
              <div className="h-6 w-full animate-pulse bg-muted" />
              <div className="h-4 w-3/4 animate-pulse bg-muted" />
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          No blog posts available at the moment.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
      {blogs.map((blog) => (
        <BlogCard
          blog={blog}
          key={(blog as { objectID?: string; _id: string }).objectID ?? blog._id}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}
