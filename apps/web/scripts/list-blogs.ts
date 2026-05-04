import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";

// Configuration from your project
const client = createClient({
  projectId: "whxgudbc",
  dataset: "production",
  useCdn: false,
  apiVersion: "2024-03-01",
});

async function listBlogs() {
  const query = `*[_type == "blog"] {
    title,
    "categories": categories[]->title
  } | order(title asc)`;

  try {
    const blogs = await client.fetch(query);
    
    let content = "# Blog Inventory\n\n";
    content += "| Blog Title | Categories |\n";
    content += "| :--- | :--- |\n";

    blogs.forEach((blog: any) => {
      const categories = blog.categories?.filter((c: any) => c !== null).join(", ") || "None";
      content += `| ${blog.title} | ${categories} |\n`;
    });

    const outputPath = path.join(process.cwd(), "blog_inventory_generated.md");
    fs.writeFileSync(outputPath, content);
    
    console.log(`Successfully generated blog inventory at: ${outputPath}`);
    console.log(`Total blogs found: ${blogs.length}`);
  } catch (error) {
    console.error("Error fetching blogs:", error);
  }
}

listBlogs();
