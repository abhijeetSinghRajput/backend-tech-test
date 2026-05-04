import algoliasearch from "algoliasearch";
import indexer from "sanity-algolia";

// Check if we are in a browser environment or server environment
// In Sanity Studio, process.env is handled by Vite
const APP_ID = process.env.SANITY_STUDIO_ALGOLIA_APP_ID || "";
const ADMIN_KEY = process.env.SANITY_STUDIO_ALGOLIA_ADMIN_KEY || "";
const INDEX_NAME = process.env.SANITY_STUDIO_ALGOLIA_INDEX_NAME || "blog_index";

const algoliaClient = algoliasearch(APP_ID, ADMIN_KEY);
const algoliaIndex = algoliaClient.initIndex(INDEX_NAME);

export const algoliaIndexer = indexer(
  {
    blog: {
      index: algoliaIndex,
      projection: `{
        "objectID": _id,
        title,
        "slug": slug.current,
        "excerpt": description,
        "categories": categories[]->title,
        "body": pt::text(richText),
        "image": {
          "id": image.asset._ref,
          "preview": image.asset->metadata.lqip,
          "alt": coalesce(image.alt, image.asset->altText, "untitled"),
          "hotspot": image.hotspot { x, y },
          "crop": image.crop { bottom, left, right, top }
        },
        "authors": authors[0]->{
          _id,
          name,
          position,
          "image": {
            "id": image.asset._ref,
            "preview": image.asset->metadata.lqip,
            "alt": coalesce(image.alt, image.asset->altText, "untitled"),
            "hotspot": image.hotspot { x, y },
            "crop": image.crop { bottom, left, right, top }
          }
        },
        publishedAt,
        ogImage
      }`,
    },
  },
  (document) => {
    // Custom transformation if needed
    // The projection already does most of the work
    return document;
  }
);
