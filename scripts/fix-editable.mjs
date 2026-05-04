import { createClient } from "@sanity/client";

const sanity = createClient({
  projectId: "whxgudbc",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: "skTSfYaOqfUmSzu58lu3QQimuYRNd11LLh2XA6eHBwMvwYhhcQkt4CkRJ42voeF1DVizInAj4rH1nnvWkeGhSxgPl36mQHk40elhraUVP3lh4VFVMKcaz2KLeoZmsQgVTFkELHP69CFgiEIl83bssDccFUxrTxgwsU51MJZksVgMmWCoAw08",
  useCdn: false,
});

async function fixEditable() {
  // Fetch only the migrated blogs with custom "blog-" prefixed IDs
  const blogs = await sanity.fetch(
    `*[_type == "blog" && _id match "blog-*" && !(_id in path("drafts.**"))]{...}`
  );

  console.log(`Found ${blogs.length} non-editable blogs\n`);

  for (const blog of blogs) {
    const draftId = `drafts.${blog._id}`;

    try {
      // Create a draft version of the document
      await sanity.createOrReplace({
        ...blog,
        _id: draftId,
      });
      console.log(`✅ Now editable: ${blog.title}`);
    } catch (err) {
      console.error(`❌ Failed: ${blog.title} — ${err.message}`);
    }
  }

  console.log("\n🎉 Done — open Sanity Studio, all blogs should be editable now");
}

fixEditable();
