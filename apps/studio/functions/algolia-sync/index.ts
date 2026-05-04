import { createClient } from "@sanity/client";
import { documentEventHandler } from "@sanity/functions";
import algoliasearch from "algoliasearch";
import indexer from "sanity-algolia";

const APP_ID = process.env.SANITY_STUDIO_ALGOLIA_APP_ID || "";
const ADMIN_KEY = process.env.SANITY_STUDIO_ALGOLIA_ADMIN_KEY || "";
const INDEX_NAME = process.env.SANITY_STUDIO_ALGOLIA_INDEX_NAME || "blog_index";

const algoliaClient = algoliasearch(APP_ID, ADMIN_KEY);
const algoliaIndex = algoliaClient.initIndex(INDEX_NAME);

const algoliaIndexer = indexer(
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
  }
);

export const handler = documentEventHandler(async ({ context, event }) => {
  const client = createClient({
    ...context.clientOptions,
    useCdn: false,
    apiVersion: "2023-01-01",
  });

  const { documentId, operation } = event;
  
  // Skip drafts to avoid duplicates in Algolia
  if (documentId.startsWith("drafts.")) {
    return;
  }

  if (operation === "publish" || operation === "update") {
    await algoliaIndexer.update(
      [{ operation: "publish", id: documentId }],
      (id) => client.fetch(`*[_id == $id][0]`, { id })
    );
  } else if (operation === "unpublish" || operation === "delete") {
    await algoliaIndexer.update(
      [{ operation: "delete", id: documentId }],
      (id) => client.fetch(`*[_id == $id][0]`, { id })
    );
  }
});
