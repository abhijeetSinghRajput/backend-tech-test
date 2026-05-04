"use client";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { type FC, useCallback, useMemo } from "react";
import slugify from "slugify";

import type { SanityRichTextBlock, SanityRichTextProps } from "@/types";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type TableOfContentProps = {
  richText?: SanityRichTextProps;
  className?: string;
  maxDepth?: number;
};

type ProcessedHeading = {
  readonly id: string;
  readonly text: string;
  readonly href: string;
  readonly level: number;
  readonly style: HeadingStyle;
  readonly children: ProcessedHeading[];
  readonly isChild: boolean;
  readonly _key?: string;
};

type AnchorProps = {
  readonly heading: ProcessedHeading;
  readonly index?: number;
  readonly maxDepth?: number;
  readonly currentDepth?: number;
};

type TableOfContentState = {
  readonly shouldShow: boolean;
  readonly headings: ProcessedHeading[];
  readonly error?: string;
};

type HeadingStyle = "h2" | "h3" | "h4" | "h5" | "h6";

type SanityTextChild = {
  readonly marks?: readonly string[];
  readonly text?: string;
  readonly _type: "span";
  readonly _key: string;
};

type HeadingBlock = Extract<SanityRichTextBlock, { _type: "block" }> & {
  style: HeadingStyle;
  children: readonly SanityTextChild[];
};

// ============================================================================
// CONSTANTS
// ============================================================================

const HEADING_STYLES: Record<HeadingStyle, string> = {
  h2: "pl-0",
  h3: "pl-4",
  h4: "pl-8",
  h5: "pl-12",
  h6: "pl-16",
} as const;

const HEADING_LEVELS: Record<HeadingStyle, number> = {
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
} as const;

const SLUGIFY_OPTIONS = {
  lower: true,
  strict: true,
  remove: /[*+~.()'"!:@]/g,
} as const;

const DEFAULT_MAX_DEPTH = 6;
const MIN_HEADINGS_TO_SHOW = 1;

// ============================================================================
// TYPE GUARDS & VALIDATORS
// ============================================================================

function isValidHeadingStyle(style: unknown): style is HeadingStyle {
  return typeof style === "string" && style in HEADING_STYLES;
}

function isValidTextChild(child: unknown): child is SanityTextChild {
  return (
    typeof child === "object" &&
    child !== null &&
    "_type" in child &&
    child._type === "span" &&
    "text" in child &&
    typeof child.text === "string"
  );
}

function hasValidTextChildren(
  children: unknown
): children is readonly SanityTextChild[] {
  return (
    Array.isArray(children) &&
    children.length > 0 &&
    children.every(isValidTextChild)
  );
}

function isHeadingBlock(block: unknown): block is HeadingBlock {
  if (
    typeof block !== "object" ||
    block === null ||
    !("_type" in block) ||
    block._type !== "block"
  ) {
    return false;
  }

  const candidate = block as Record<string, unknown>;

  return (
    isValidHeadingStyle(candidate.style) &&
    hasValidTextChildren(candidate.children)
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function createSlug(text: string): string {
  if (!text?.trim()) {
    return "";
  }

  try {
    return slugify(text.trim(), SLUGIFY_OPTIONS);
  } catch (_error) {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  }
}

function extractTextFromChildren(children: readonly SanityTextChild[]): string {
  try {
    return children
      .map((child) => child.text?.trim() ?? "")
      .filter(Boolean)
      .join(" ")
      .trim();
  } catch (_error) {
    return "";
  }
}

function generateUniqueId(text: string, index: number, _key?: string): string {
  const baseId = _key || createSlug(text) || `heading-${index}`;
  return `toc-${baseId}`;
}

// ============================================================================
// CORE BUSINESS LOGIC
// ============================================================================

function extractHeadingBlocks(richText: SanityRichTextProps): HeadingBlock[] {
  if (!(richText && Array.isArray(richText))) {
    return [];
  }

  try {
    return richText.filter(isHeadingBlock);
  } catch (_error) {
    return [];
  }
}

function createProcessedHeading(
  block: HeadingBlock,
  index: number
): ProcessedHeading | null {
  try {
    const text = extractTextFromChildren(block.children);

    if (!text) {
      return null;
    }

    const level = HEADING_LEVELS[block.style];
    const href = `#${createSlug(text)}`;
    const id = generateUniqueId(text, index, block._key);

    return {
      id,
      text,
      href,
      level,
      style: block.style,
      children: [],
      isChild: false,
      _key: block._key,
    };
  } catch (_error) {
    return null;
  }
}

function buildHeadingHierarchy(
  flatHeadings: ProcessedHeading[],
  maxDepth: number = DEFAULT_MAX_DEPTH
): ProcessedHeading[] {
  if (flatHeadings.length === 0) {
    return [];
  }

  try {
    const result: ProcessedHeading[] = [];
    const processed = new Set<number>();

    flatHeadings.forEach((heading, index) => {
      if (processed.has(index) || heading.level > maxDepth) {
        return;
      }

      const children = collectChildHeadings(
        flatHeadings,
        index,
        processed,
        maxDepth
      );

      result.push({
        ...heading,
        children,
      });
    });

    return result;
  } catch (_error) {
    return flatHeadings.map((heading) => ({
      ...heading,
      children: [],
    }));
  }
}

function collectChildHeadings(
  headings: ProcessedHeading[],
  parentIndex: number,
  processed: Set<number>,
  maxDepth: number
): ProcessedHeading[] {
  const parentHeading = headings[parentIndex];

  if (!parentHeading || parentHeading.level >= maxDepth) {
    return [];
  }

  const children: ProcessedHeading[] = [];
  const parentLevel = parentHeading.level;

  for (let i = parentIndex + 1; i < headings.length; i++) {
    const currentHeading = headings[i];

    if (!currentHeading || currentHeading.level <= parentLevel) {
      break;
    }

    if (processed.has(i) || currentHeading.level > maxDepth) {
      continue;
    }

    processed.add(i);

    const nestedChildren = collectChildHeadings(
      headings,
      i,
      processed,
      maxDepth
    );

    children.push({
      ...currentHeading,
      children: nestedChildren,
      isChild: true,
    });
  }

  return children;
}

function processHeadingBlocks(
  headingBlocks: HeadingBlock[],
  maxDepth: number = DEFAULT_MAX_DEPTH
): ProcessedHeading[] {
  if (!Array.isArray(headingBlocks) || headingBlocks.length === 0) {
    return [];
  }

  try {
    const processedHeadings = headingBlocks
      .map(createProcessedHeading)
      .filter((heading): heading is ProcessedHeading => heading !== null);

    return buildHeadingHierarchy(processedHeadings, maxDepth);
  } catch (_error) {
    return [];
  }
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useTableOfContentState(
  richText?: SanityRichTextProps,
  maxDepth: number = DEFAULT_MAX_DEPTH
): TableOfContentState {
  return useMemo(() => {
    try {
      if (!(richText && Array.isArray(richText)) || richText.length === 0) {
        return {
          shouldShow: false,
          headings: [],
        };
      }

      const headingBlocks = extractHeadingBlocks(richText);

      if (headingBlocks.length < MIN_HEADINGS_TO_SHOW) {
        return {
          shouldShow: false,
          headings: [],
        };
      }

      const processedHeadings = processHeadingBlocks(headingBlocks, maxDepth);

      return {
        shouldShow: processedHeadings.length >= MIN_HEADINGS_TO_SHOW,
        headings: processedHeadings,
      };
    } catch (error) {
      return {
        shouldShow: false,
        headings: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, [richText, maxDepth]);
}

// ============================================================================
// COMPONENTS
// ============================================================================

const TableOfContentAnchor: FC<AnchorProps> = ({
  heading,
  index,
  maxDepth = DEFAULT_MAX_DEPTH,
  currentDepth = 1,
}) => {
  const { href, text, children, isChild } = heading;

  const shouldRenderChildren = useCallback(
    () =>
      Array.isArray(children) && children.length > 0 && currentDepth < maxDepth,
    [children, currentDepth, maxDepth]
  );

  if (currentDepth > maxDepth) {
    return null;
  }

  if (!(text?.trim() && href?.trim())) {
    return null;
  }

  const hasChildren = shouldRenderChildren();
  // Using active state logic here would be ideal if we tracked scroll position.
  // For now, we hardcode false as in the reference, or true if it's the first.
  const isActive = false;

  if (isChild) {
    return (
      <li className="relative" data-active={isActive}>
        <Link
          className={cn(
            "block truncate text-sm transition-colors hover:text-foreground dark:hover:text-foreground",
            isActive
              ? "font-medium text-foreground dark:text-foreground"
              : "text-muted-foreground dark:text-muted-foreground"
          )}
          href={href}
        >
          {text}
        </Link>
        {hasChildren && (
          <div className="relative ms-4 space-y-3 ps-3 mt-3">
            <div
              aria-hidden="true"
              className="absolute start-0 top-0 bottom-0 w-px bg-border dark:bg-border"
            />
            <ol className="m-0 list-none space-y-3 p-0">
              {children.map((child, childIndex) => (
                <TableOfContentAnchor
                  currentDepth={currentDepth + 1}
                  heading={child}
                  key={
                    child.id || `${child.text}-${childIndex}-${currentDepth}`
                  }
                  maxDepth={maxDepth}
                  index={childIndex}
                />
              ))}
            </ol>
          </div>
        )}
      </li>
    );
  }

  return (
    <li className="flex flex-col space-y-3">
      <div className="flex items-start" data-active={isActive}>
        <span
          aria-hidden="true"
          className="me-3 font-mono text-sm text-muted-foreground dark:text-muted-foreground"
        >
          {((index || 0) + 1).toString().padStart(2, "0")}
        </span>
        <Link
          className="truncate text-sm transition-colors hover:text-foreground dark:hover:text-foreground text-muted-foreground dark:text-muted-foreground"
          href={href}
        >
          {text}
        </Link>
      </div>

      {hasChildren && (
        <div className="relative ms-4 space-y-3 ps-3">
          <div
            aria-hidden="true"
            className="absolute start-0 top-0 bottom-0 w-px bg-border dark:bg-border"
          />
          <ol className="m-0 list-none space-y-3 p-0">
            {children.map((child, childIndex) => (
              <TableOfContentAnchor
                currentDepth={currentDepth + 1}
                heading={child}
                key={child.id || `${child.text}-${childIndex}-${currentDepth}`}
                maxDepth={maxDepth}
                index={childIndex}
              />
            ))}
          </ol>
        </div>
      )}
    </li>
  );
};

export const TableOfContent: FC<TableOfContentProps> = ({
  richText,
  maxDepth = DEFAULT_MAX_DEPTH,
}) => {
  const { shouldShow, headings, error } = useTableOfContentState(
    richText,
    maxDepth
  );

  if (error) {
    return null;
  }

  if (!shouldShow || headings.length === 0) {
    return null;
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-8 left-0 flex flex-col">
        <h2
          className="mb-4 font-semibold text-lg text-foreground dark:text-foreground"
          id="toc-heading"
        >
          Table of contents
        </h2>
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-8 bg-gradient-to-b from-background to-transparent opacity-0 transition-opacity duration-300"
          />
          <div
            className="max-h-[calc(100vh-12rem)] overflow-y-auto pe-4"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgb(228, 228, 231) transparent",
            }}
          >
            <nav aria-labelledby="toc-heading" className="pt-4 pb-32">
              <ol className="m-0 flex list-none flex-col space-y-4 p-0 text-muted-foreground dark:text-muted-foreground">
                {headings.map((heading, index) => (
                  <TableOfContentAnchor
                    currentDepth={1}
                    heading={heading}
                    index={index}
                    key={heading.id || `${heading.text}-${index}`}
                    maxDepth={maxDepth}
                  />
                ))}
              </ol>
            </nav>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8 bg-gradient-to-t from-background to-transparent opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>
    </aside>
  );
};
