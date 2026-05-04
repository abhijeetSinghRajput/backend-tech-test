import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-08-29",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const PRIMARY_ID = "f9e07dc4-ae2d-498c-895d-0dd8ab3ad519";
const DUPLICATE_ID = "4814e7b4-95df-4991-a5e7-ec65892a090e";

async function fixDuplicate() {
  console.log("Finding all documents (including drafts) referencing the duplicate DAA category...");
  // Use perspective: 'raw' to see both draft and published versions
  const docs = await client.fetch(
    `*[references($id)] { _id, title, categories }`,
    { id: DUPLICATE_ID }
  );
  
  console.log(`Found ${docs.length} documents to update.`);

  for (const doc of docs) {
    console.log(`Updating: ${doc._id} (${doc.title || 'Untitled'})`);
    
    if (!doc.categories) continue;

    const updatedCategories = doc.categories.map(cat => {
      if (cat._ref === DUPLICATE_ID) {
        return { ...cat, _ref: PRIMARY_ID };
      }
      return cat;
    });

    const seen = new Set();
    const finalCategories = updatedCategories.filter(cat => {
      if (seen.has(cat._ref)) return false;
      seen.add(cat._ref);
      return true;
    });

    await client
      .patch(doc._id)
      .set({ categories: finalCategories })
      .commit();
  }

  console.log("Attempting to delete duplicate category again...");
  try {
    await client.delete(DUPLICATE_ID);
    console.log("Duplicate category deleted successfully.");
  } catch (err) {
    console.error("Failed to delete category:", err.message);
    if (err.details && err.details.items) {
        console.error("Remaining references:", JSON.stringify(err.details.items, null, 2));
    }
  }
}

fixDuplicate().catch(console.error);
