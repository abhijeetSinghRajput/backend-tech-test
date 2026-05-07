import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";

import type { Blog } from "@/types";
import { useDebounce } from "./use-debounce";

const SEARCH_DEBOUNCE_MS = 400;
const CACHE_STALE_TIME_MS = 30_000;

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "";
const SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || "";
const INDEX_NAME = "blog_index";

// Lazy singleton — only initialized when the user actually searches
let lazyIndex: ReturnType<ReturnType<typeof import("algoliasearch/lite")["default"]>["initIndex"]> | null = null;

async function getIndex() {
  if (!lazyIndex) {
    const { default: algoliasearch } = await import("algoliasearch/lite");
    const client = algoliasearch(APP_ID, SEARCH_KEY);
    lazyIndex = client.initIndex(INDEX_NAME);
  }
  return lazyIndex;
}

async function searchBlog(query: string, category: string | null) {
  if (!query.trim()) {
    return { results: [], count: 0 };
  }

  const filters = category ? `categories:"${category}"` : "";
  const index = await getIndex();

  const response = await index.search(query, {
    filters,
    attributesToHighlight: ["title", "excerpt", "body"],
    highlightPreTag: "<mark>",
    highlightPostTag: "</mark>",
  });

  const results = response.hits.map((hit: Record<string, unknown>) => ({
    ...hit,
    _highlightResult: hit._highlightResult,
  })) as unknown as Blog[];

  return { results, count: response.nbHits };
}

export function useBlogSearch(category: string | null = null) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

  const hasQuery = debouncedQuery.trim().length > 0;
  const { data, isLoading, error } = useQuery({
    queryKey: ["blog-search", debouncedQuery, category],
    queryFn: () => searchBlog(debouncedQuery, category),
    enabled: hasQuery,
    staleTime: CACHE_STALE_TIME_MS,
  });

  return {
    searchQuery,
    setSearchQuery,
    results: data?.results ?? [],
    totalCount: data?.count ?? 0,
    isSearching: isLoading,
    error,
    hasQuery,
  };
}
