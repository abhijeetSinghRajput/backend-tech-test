import { useQuery } from "@tanstack/react-query";
import algoliasearch from "algoliasearch/lite";
import { useState } from "react";

import type { Blog } from "@/types";
import { useDebounce } from "./use-debounce";

const SEARCH_DEBOUNCE_MS = 400;
const CACHE_STALE_TIME_MS = 30_000;

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "";
const SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || "";
const INDEX_NAME = "blog_index";

const searchClient = algoliasearch(APP_ID, SEARCH_KEY);
const index = searchClient.initIndex(INDEX_NAME);

async function searchBlog(query: string, category: string | null) {
  if (!query.trim()) {
    return { results: [], count: 0 };
  }

  const filters = category ? `categories:"${category}"` : "";

  const response = await index.search(query, {
    filters,
    attributesToHighlight: ["title", "excerpt", "body"],
    highlightPreTag: "<mark>",
    highlightPostTag: "</mark>",
  });

  const results = response.hits.map((hit: Record<string, unknown>) => ({
    ...hit,
    // Add highlighting info to the blog object for the UI to use
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
