// nuclear-fix.mjs
import { createClient } from "@sanity/client";

const sanity = createClient({
  projectId: "whxgudbc",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: "skTSfYaOqfUmSzu58lu3QQimuYRNd11LLh2XA6eHBwMvwYhhcQkt4CkRJ42voeF1DVizInAj4rH1nnvWkeGhSxgPl36mQHk40elhraUVP3lh4VFVMKcaz2KLeoZmsQgVTFkELHP69CFgiEIl83bssDccFUxrTxgwsU51MJZksVgMmWCoAw08",
  useCdn: false,
});

async function nuclearFix() {
  // 1. Fetch all broken blogs (blog- prefixed)
  const blogs = await sanity.fetch(
    `*[_type == "blog" && _id match "blog-*"]{...}`
  );

  console.log(`Found ${blogs.length} broken blogs\n`);

  for (const blog of blogs) {
    try {
      // 2. Create a brand new doc WITHOUT _id (Sanity generates UUID)
      const { _id, _rev, _createdAt, _updatedAt, ...cleanDoc } = blog;

      const newDoc = await sanity.create({
        ...cleanDoc,
        _type: "blog",
      });

      console.log(`✅ Recreated: ${blog.title} → new _id: ${newDoc._id}`);

      // 3. Delete the old broken doc and its draft
      await sanity.delete(blog._id);
      try { await sanity.delete(`drafts.${blog._id}`); } catch (_) {}

      console.log(`🗑️  Deleted old: ${blog._id}`);

    } catch (err) {
      console.error(`❌ Failed: ${blog.title} — ${err.message}`);
    }
  }

  console.log("\n🎉 Done — all blogs recreated with proper Sanity UUIDs");
}

nuclearFix();