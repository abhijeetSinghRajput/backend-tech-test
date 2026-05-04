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

const catIds = {
  "Algorithm": "5cbb6dd3-6605-467f-bfe7-5cf899eb7f8c",
  "Data Structure": "9f38b125-9c10-4d87-8b84-000bd7e065b7",
  "Mathematics": "61594b32-65a0-4b31-bb17-e8103c14ab5f",
  "Machine Learning": "ba2cdba7-685b-4342-a538-6bae930bce7f",
  "AI ML": "5eae9df5-ef33-4a59-8add-1690eb797aa7",
  "Data Science": "e1602007-c17d-456b-87e8-81f1648a873a",
  "DAA": "4814e7b4-95df-4991-a5e7-ec65892a090e"
};

const manualMappings = [
  { title: "#Binary Search:", cats: ["Data Structure", "Algorithm"] },
  { title: "Binary Search (Recurrence Relation)", cats: ["Algorithm", "Mathematics"] },
  { title: "Quick Sort", cats: ["Algorithm", "Data Structure"] },
  { title: "Tower of hanoi", cats: ["Algorithm", "Mathematics"] },
  { title: "Dynamic Programming & 0/1 Knapsack", cats: ["Algorithm"] },
  { title: "Fraction Knapsack", cats: ["Algorithm"] },
  { title: "MiniMax using Divide and conquer approach", cats: ["Algorithm"] },
  { title: "Square Root Decomposition", cats: ["Data Structure", "Algorithm"] },
  { title: "Asymtotic Notation", cats: ["Mathematics", "Algorithm"] },
  { title: "comparison of two functions", cats: ["Mathematics", "Algorithm"] },
  { title: "Ensambling Learning", cats: ["Machine Learning", "AI ML"] },
  { title: "How Machine Learns?", cats: ["Machine Learning", "AI ML", "Data Science"] },
  { title: "Loss Function", cats: ["Machine Learning", "AI ML", "Mathematics"] },
  { title: "Time Series & Arima Model of Forecasting", cats: ["Data Science", "Machine Learning"] },
  { title: "Data Preprocessing And Grid Search", cats: ["Data Science", "Machine Learning"] },
  { title: "Data Visualization", cats: ["Data Science"] },
  { title: "NLP", cats: ["Machine Learning", "AI ML"] },
  { title: "ICA", cats: ["Machine Learning", "Data Science"] },
  { title: "Data Modelling", cats: ["Data Science"] },
  { title: "Data Science", cats: ["Data Science"] },
  { title: "Profit and Loss", cats: ["Mathematics"] },
  { title: "distance and time", cats: ["Mathematics"] },
  { title: "Concept of Controlled and Uncontrolled", cats: ["Mathematics", "Data Science"] },
  { title: "DAA Assignment 1", cats: ["Algorithm", "DAA"] },
  { title: "Compare the growth of the functions", cats: ["Algorithm", "DAA"] }, // User's DAA Assignment 1
  { title: "DAA PYQ", cats: ["Algorithm", "DAA"] },
  { title: "HWI Practice", cats: ["Algorithm", "Data Structure"] }
];

async function applyManualPatches() {
  console.log("Fetching blogs...");
  const blogs = await client.fetch(`*[_type == "blog"] { _id, title }`);
  
  for (const mapping of manualMappings) {
    const matchingBlogs = blogs.filter(b => b.title === mapping.title);
    if (matchingBlogs.length > 0) {
      for (const blog of matchingBlogs) {
        console.log(`Patching: ${blog.title}`);
        await client
          .patch(blog._id)
          .set({
            categories: mapping.cats.map(catName => ({
              _type: "reference",
              _ref: catIds[catName],
              _key: Math.random().toString(36).substring(2, 11)
            }))
          })
          .commit();
      }
    } else {
      console.warn(`No blog found with title: ${mapping.title}`);
    }
  }
  console.log("Finished manual patching.");
}

applyManualPatches().catch(console.error);
