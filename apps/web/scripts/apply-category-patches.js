import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-08-29",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const categories = {
  "SQL": "43029eb5-f637-4187-b3d5-971f5899a87f",
  "Algorithm": "5cbb6dd3-6605-467f-bfe7-5cf899eb7f8c",
  "AI ML": "5eae9df5-ef33-4a59-8add-1690eb797aa7",
  "Mathematics": "61594b32-65a0-4b31-bb17-e8103c14ab5f",
  "Networking": "6d3f23db-0e5f-4819-a858-2bcf3ecc8cd0",
  "Javascript": "82abe3a7-718c-402b-84e2-dddda66694cf",
  "Git": "88ee551c-3431-4284-8878-269d09684709",
  "Database": "98af7178-e79b-4244-8750-27b3a8e191e5",
  "Data Structure": "9f38b125-9c10-4d87-8b84-000bd7e065b7",
  "Frontend": "ad8fe091-ffa5-4726-ad19-30dc4212563c",
  "Clustering": "b37760c2-ce68-4eab-9cce-b5b8d263c20b",
  "Typescript": "b81f601b-0bbc-493b-9dd1-14dd4092e18c",
  "Machine learning": "ba2cdba7-685b-4342-a538-6bae930bce7f",
  "Data Science": "e1602007-c17d-456b-87e8-81f1648a873a",
  "Next.js": "f9d8f8ef-e1c7-4517-83ea-907193dc9637"
};

const keywordMap = [
  { keywords: ["sql"], cat: "SQL" },
  { keywords: ["algorithm", "id3", "apriori", "dijkstra", "floyd", "kruskal", "prim", "fp-growth", "manacher"], cat: "Algorithm" },
  { keywords: ["ai", "ml", "neural network", "perceptron", "rnn", "cnn", "lstm", "markov", "mdp"], cat: "AI ML" },
  { keywords: ["mathematics", "math", "logrithm", "statistics", "quant", "combination", "permutation", "aptitude", "regression", "gaussian"], cat: "Mathematics" },
  { keywords: ["networking", "tcp", "udp"], cat: "Networking" },
  { keywords: ["javascript", "js", "node"], cat: "Javascript" },
  { keywords: ["git"], cat: "Git" },
  { keywords: ["database", "db", "triggers"], cat: "Database" },
  { keywords: ["data structure", "array", "graph", "tree", "stack", "queue", "pointers", "strings"], cat: "Data Structure" },
  { keywords: ["frontend", "react", "next.js", "browser", "reflow", "hook", "props", "ref", "usestate"], cat: "Frontend" },
  { keywords: ["clustering", "k-means", "db scan", "spectral"], cat: "Clustering" },
  { keywords: ["typescript"], cat: "Typescript" },
  { keywords: ["machine learning", "regression", "svm", "knn", "id3", "random forest", "xgboost", "gradient descent", "learning models", "dimensionality reduction"], cat: "Machine learning" },
  { keywords: ["data science"], cat: "Data Science" },
  { keywords: ["next.js"], cat: "Next.js" }
];

async function applyPatches() {
  console.log("Fetching blogs...");
  const blogs = await client.fetch(`*[_type == "blog"] { _id, title }`);
  console.log(`Found ${blogs.length} blogs.`);

  const titleToCats = {};

  blogs.forEach(blog => {
    const title = blog.title.toLowerCase();
    const assignedCats = new Set();

    keywordMap.forEach(item => {
      if (item.keywords.some(k => title.includes(k))) {
        assignedCats.add(categories[item.cat]);
      }
    });

    if (assignedCats.size > 0) {
      titleToCats[blog.title] = Array.from(assignedCats);
    }
  });

  console.log("Applying patches...");
  let count = 0;
  for (const blog of blogs) {
    const cats = titleToCats[blog.title];
    if (cats) {
      await client
        .patch(blog._id)
        .set({
          categories: cats.map(id => ({
            _type: "reference",
            _ref: id,
            _key: Math.random().toString(36).substring(2, 11)
          }))
        })
        .commit();
      console.log(`Patched: ${blog.title}`);
      count++;
    }
  }

  console.log(`Successfully patched ${count} blogs.`);
}

applyPatches().catch(err => {
  console.error("Error applying patches:", err);
});
