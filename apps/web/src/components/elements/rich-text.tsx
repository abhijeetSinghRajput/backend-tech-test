import { Logger } from "@workspace/logger";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { PortableText, type PortableTextReactComponents } from "next-sanity";
import { BlockMath } from "react-katex";

import type { SanityRichTextProps } from "@/types";
import { parseChildrenToSlug } from "@/utils";
import { CodeBlock } from "./code-block";
import { SanityImage } from "./sanity-image";

const logger = new Logger("RichText");

const components: Partial<PortableTextReactComponents> = {
  block: {
    h1: ({ children, value }) => {
      const slug = parseChildrenToSlug(value.children);
      return (
        <h1
          className="scroll-m-20 font-bold text-4xl text-foreground mt-12 mb-4 first:mt-0"
          id={slug}
        >
          {children}
        </h1>
      );
    },
    h2: ({ children, value }) => {
      const slug = parseChildrenToSlug(value.children);
      return (
        <h2
          className="scroll-m-20 font-bold text-3xl text-foreground mt-10 mb-4 first:mt-0 border-b border-border/50 pb-2"
          id={slug}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, value }) => {
      const slug = parseChildrenToSlug(value.children);
      return (
        <h3 className="scroll-m-20 font-semibold text-2xl mt-8 mb-3" id={slug}>
          {children}
        </h3>
      );
    },
    h4: ({ children, value }) => {
      const slug = parseChildrenToSlug(value.children);
      return (
        <h4 className="scroll-m-20 font-semibold text-xl mt-6 mb-2" id={slug}>
          {children}
        </h4>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary/30 pl-4 py-1 my-6 text-foreground/80 italic bg-muted/20 rounded-r-md">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="leading-7 text-foreground/90 my-3 min-h-[1.5rem]">
        {children}
      </p>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-bold text-foreground">{children}</strong>
    ),
    code: ({ children }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground font-medium">
        {children}
      </code>
    ),
    customLink: ({ children, value }) => {
      if (!value.href || value.href === "#") {
        return (
          <span className="underline decoration-muted-foreground/30 underline-offset-4 decoration-1">
            {children}
          </span>
        );
      }
      return (
        <Link
          aria-label={`Link to ${value?.href}`}
          className="underline decoration-primary/30 underline-offset-4 decoration-1 transition-colors hover:text-primary hover:decoration-primary"
          href={value.href}
          prefetch={false}
          target={value.openInNewTab ? "_blank" : "_self"}
        >
          {children}
        </Link>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc ml-6 my-4 space-y-2 text-foreground/90 marker:text-muted-foreground">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal ml-6 my-4 space-y-2 text-foreground/90 marker:text-muted-foreground">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
    number: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
  },
  types: {
    image: ({ value }) => {
      if (!value?.id) return null;
      return (
        <figure className="my-10 group">
          <div className="overflow-hidden rounded-xl border border-border shadow-sm transition-shadow group-hover:shadow-md">
            <SanityImage
              className="h-auto w-full"
              height={900}
              image={value}
              width={1600}
            />
          </div>
          {value?.caption && (
            <figcaption className="mt-3 text-center text-sm text-muted-foreground italic">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    customTable: ({ value }) => {
      if (!value?.rows || value.rows.length === 0) return null;
      return (
        <div className="my-8 w-full overflow-x-auto rounded-lg border border-border shadow-sm">
          <table className="w-full text-sm text-left border-collapse">
            <tbody>
              {value.rows.map(
                (row: { _key?: string; cells: string[] }, rowIndex: number) => (
                  <tr
                    key={row._key || rowIndex}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors hover:bg-muted/30",
                      rowIndex === 0 &&
                        "bg-muted/50 font-semibold text-foreground"
                    )}
                  >
                    {row.cells?.map((cell: string, cellIndex: number) => (
                      <td
                        key={`${row._key || rowIndex}-${cellIndex}`}
                        className="px-4 py-3 border-r border-border last:border-0 align-top text-foreground/80"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      );
    },
    codeBlock: ({ value }) => {
      if (!value?.code) return null;
      return (
        <CodeBlock
          code={value.code}
          language={value.language}
          filename={value.filename}
        />
      );
    },
    mathBlock: ({ value }) => {
      if (!value?.latex) return null;
      return (
        <div className="my-8 flex justify-center p-6 text-foreground/90">
          <BlockMath math={value.latex} />
        </div>
      );
    },
  },
  hardBreak: () => <br />,
};

export function RichText<T extends SanityRichTextProps>({
  richText,
  className,
}: {
  richText?: T | null;
  className?: string;
}) {
  if (!richText) return null;

  return (
    <div
      className={cn(
        "prose prose-neutral max-w-none dark:prose-invert",
        "prose-headings:text-foreground prose-headings:scroll-m-24",
        "prose-p:text-foreground/90",
        "prose-a:no-underline hover:prose-a:text-primary",
        "prose-strong:text-foreground",
        "prose-code:before:content-none prose-code:after:content-none",
        "prose-hr:border-border",
        className
      )}
    >
      <PortableText
        components={components}
        onMissingComponent={(_, { nodeType, type }) => {
          logger.warn(`Missing component: ${nodeType} for type: ${type}`);
        }}
        value={richText}
      />
    </div>
  );
}
