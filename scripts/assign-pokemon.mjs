import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from different possible locations
dotenv.config({ path: resolve(process.cwd(), ".env") });
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), "apps/studio/.env") });

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_DATASET || process.env.SANITY_STUDIO_DATASET;
const SANITY_WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_STUDIO_API_WRITE_TOKEN;

if (!SANITY_PROJECT_ID || !SANITY_DATASET || !SANITY_WRITE_TOKEN) {
  console.error("❌ Missing required environment variables. Ensure SANITY_PROJECT_ID, SANITY_DATASET, and SANITY_WRITE_TOKEN are set.");
  process.exit(1);
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  token: SANITY_WRITE_TOKEN,
  useCdn: false,
  apiVersion: "2023-01-01",
});

/**
 * Fisher-Yates Shuffle algorithm
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function run() {
  console.log("🚀 Starting Pokemon assignment script...");

  // 1. Fetch blogs that need a Pokemon
  console.log("🔍 Fetching blogs without a Pokemon...");
  const blogs = await client.fetch(`*[_type == "blog" && !defined(pokemon.id)]{ _id, title }`);
  
  if (blogs.length === 0) {
    console.log("✅ All blogs already have a Pokemon. Nothing to do.");
    return;
  }

  console.log(`📝 Found ${blogs.length} blogs to update.`);

  // 2. Fetch Pokemon pool
  console.log("🔴 Fetching Pokemon pool from PokéAPI...");
  const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=500");
  const data = await response.json();
  let pokemonPool = data.results.map(p => {
    // Extract ID from URL: https://pokeapi.co/api/v2/pokemon/1/
    const id = parseInt(p.url.split("/").filter(Boolean).pop());
    return { name: p.name, id, url: p.url };
  });

  if (pokemonPool.length < blogs.length) {
    throw new Error(`Not enough Pokemon in pool (${pokemonPool.length}) for blogs (${blogs.length})`);
  }

  // 3. Shuffle pool for random assignment
  shuffle(pokemonPool);

  // 4. Assign and update
  let successCount = 0;
  for (let i = 0; i < blogs.length; i++) {
    const blog = blogs[i];
    const pokemonBase = pokemonPool[i];

    try {
      // 5. Fetch detailed Pokemon data for artwork
      const detailRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonBase.id}`);
      const detailData = await detailRes.json();
      
      const image = detailData.sprites.other["official-artwork"].front_default || detailData.sprites.front_default;

      // 6. Patch Sanity
      await client
        .patch(blog._id)
        .set({
          pokemon: {
            name: pokemonBase.name,
            id: pokemonBase.id,
            image: image,
          }
        })
        .commit();

      console.log(`✔ Assigned ${pokemonBase.name} (#${pokemonBase.id}) → ${blog._id} (${blog.title})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to assign Pokemon to blog ${blog._id}:`, error.message);
    }
  }

  console.log(`\n✨ Finished! Successfully updated ${successCount} blogs.`);
}

run().catch((err) => {
  console.error("💥 Script failed:", err);
  process.exit(1);
});
