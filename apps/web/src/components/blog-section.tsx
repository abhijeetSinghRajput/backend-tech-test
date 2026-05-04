import { BlogList } from "@/components/blog-list";
import type { Blog } from "@/types";

export type BlogSectionProps = {
  blogs: Blog[];
  title: string;
  isFeatured?: boolean;
};

export function BlogSection({
  blogs,
  title,
  isFeatured = false,
}: BlogSectionProps) {
  if (blogs.length === 0) {
    return null;
  }

  return (
    <section className={isFeatured ? "mb-12" : ""}>
      <h2 className="sr-only">{title}</h2>
      <BlogList blogs={blogs} />
    </section>
  );
}
