import algoliasearch from "algoliasearch";

const APP_ID = process.env.SANITY_STUDIO_ALGOLIA_APP_ID || "";
const ADMIN_KEY = process.env.SANITY_STUDIO_ALGOLIA_ADMIN_KEY || "";
const INDEX_NAME = process.env.SANITY_STUDIO_ALGOLIA_INDEX_NAME || "blog_index";

const client = algoliasearch(APP_ID, ADMIN_KEY);
const index = client.initIndex(INDEX_NAME);

async function configure() {
  console.log(`Configuring Algolia index: ${INDEX_NAME}...`);
  
  try {
    await index.setSettings({
      searchableAttributes: [
        "title",
        "unordered(body)",
        "categories",
        "excerpt",
      ],
      attributesForFaceting: [
        "categories",
      ],
      customRanking: [
        "desc(publishedAt)",
      ],
      renderingContent: {
        facetOrdering: {
          facets: {
            order: ["categories"],
          },
        },
      },
    });
    console.log("Successfully configured Algolia index settings!");
  } catch (error) {
    console.error("Error configuring Algolia index:", error);
    process.exit(1);
  }
}

configure();
