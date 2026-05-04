// fix-slugs.mjs
import { createClient } from "@sanity/client";


const sanity = createClient({
  projectId: "whxgudbc", // your project id
  dataset: "production",
  token: "skTSfYaOqfUmSzu58lu3QQimuYRNd11LLh2XA6eHBwMvwYhhcQkt4CkRJ42voeF1DVizInAj4rH1nnvWkeGhSxgPl36mQHk40elhraUVP3lh4VFVMKcaz2KLeoZmsQgVTFkELHP69CFgiEIl83bssDccFUxrTxgwsU51MJZksVgMmWCoAw08", // add token here
  useCdn: false,
  apiVersion: "2025-01-01",
});


async function fixSlugs() {
  const blogs = await sanity.fetch(
    `*[_type == "blog"]{_id, title, slug}`
  );

  console.log(`Found ${blogs.length} blogs\n`);

  let success = 0, failed = 0;

  for (const blog of blogs) {
    const oldSlug = blog.slug?.current || "";

    // Strip to bare slug, then rebuild as /blog/slug
    // "xgboost"        → "/blog/xgboost"
    // "blog/xgboost"   → "/blog/xgboost"
    // "/blog/xgboost"  → "/blog/xgboost" (already correct, skip)
    const bare = oldSlug
      .replace(/^\/+/, "")
      .replace(/^blog\//, "");

    if (!bare) {
      console.warn(`⚠️  Skipping "${blog.title}" — empty slug`);
      continue;
    }

    const newSlug = `/blog/${bare}`;

    if (oldSlug === newSlug) {
      console.log(`⏭️  Already correct: "${newSlug}" (${blog.title})`);
      success++;
      continue;
    }

    try {
      await sanity.patch(blog._id).set({ "slug.current": newSlug }).commit();

      try {
        await sanity
          .patch(`drafts.${blog._id}`)
          .set({ "slug.current": newSlug })
          .commit();
      } catch (_) {}

      console.log(`✅ "${oldSlug}" → "${newSlug}" (${blog.title})`);
      success++;
    } catch (err) {
      console.error(`❌ Failed: ${blog.title} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n🎉 Done — ${success} fixed, ${failed} failed`);
}

fixSlugs();