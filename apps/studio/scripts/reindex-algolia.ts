import { createClient } from "@sanity/client";
import algoliasearch from "algoliasearch";

const APP_ID = process.env.SANITY_STUDIO_ALGOLIA_APP_ID || "";
const ADMIN_KEY = process.env.SANITY_STUDIO_ALGOLIA_ADMIN_KEY || "";
const INDEX_NAME = process.env.SANITY_STUDIO_ALGOLIA_INDEX_NAME || "blog_index";

const algoliaClient = algoliasearch(APP_ID, ADMIN_KEY);
const index = algoliaClient.initIndex(INDEX_NAME);

const sanityClient = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  useCdn: false,
  apiVersion: "2023-01-01",
  token: process.env.SANITY_STUDIO_API_WRITE_TOKEN,
});

async function reindex() {
  console.log("Fetching all blogs from Sanity...");
  
  const query = `*[_type == "blog"]{
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
  }`;
  
  try {
    const blogs = await sanityClient.fetch(query);
    console.log(`Found ${blogs.length} blogs. Syncing to Algolia...`);
    
    // Transform and truncate body to fit Algolia size limits
    const transformedBlogs = blogs.map((blog: any) => ({
      ...blog,
      body: blog.body ? blog.body.substring(0, 5000) : "",
    }));

    // Split into chunks of 100 for Algolia (smaller chunks for safety)
    const chunkSize = 100;
    for (let i = 0; i < transformedBlogs.length; i += chunkSize) {
      const chunk = transformedBlogs.slice(i, i + chunkSize);
      await index.saveObjects(chunk);
      console.log(`Synced chunk ${Math.floor(i / chunkSize) + 1}`);
    }
    
    console.log("Successfully reindexed Algolia!");
  } catch (error) {
    console.error("Error reindexing Algolia:", error);
    process.exit(1);
  }
}

reindex();
