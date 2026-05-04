import { createClient } from '@sanity/client';
import algoliasearch from 'algoliasearch';

const sanityClient = createClient({
  projectId: 'whxgudbc',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2025-08-29',
  token: 'sk0QhwYQ3i8qTCS0MFsp7v1cU0LuRU2UPIFJWupsACQKrTgRYaJBZfzLzGZ4KajHTT2hPBetl2mgII4YjIIMImiUDn1afHx9IoBciOSqEwWS1AHc2918y50LMIVhnOGZnzdtXeOWVVInHf7Xz0pNB4nzQTuhwJwM7WlzMIHMPkYFTFEpanuy'
});

const algoliaClient = algoliasearch('OQTCEVSCSR', 'fc33346f446989d7f89e20ebf8f9f78b');
const index = algoliaClient.initIndex('blog_index');

async function checkDuplicates() {
  console.log('--- STARTING DUPLICATE CHECK ---');

  // 1. Fetch all blogs from Sanity
  console.log('Fetching blogs from Sanity...');
  const sanityBlogs = await sanityClient.fetch('*[_type == "blog"]{ _id, title, "slug": slug.current }');
  console.log(`Found ${sanityBlogs.length} blogs in Sanity.`);

  // 2. Fetch all records from Algolia
  console.log('Fetching records from Algolia...');
  let algoliaRecords = [];
  await index.browseObjects({
    batch: (objects) => {
      algoliaRecords = algoliaRecords.concat(objects);
    }
  });
  console.log(`Found ${algoliaRecords.length} records in Algolia.`);

  // 3. Analyze duplicates in Algolia
  const algoliaBySlug = {};
  const drafts = [];
  const published = [];

  for (const record of algoliaRecords) {
    const isDraft = record.objectID.startsWith('drafts.');
    if (isDraft) drafts.push(record);
    else published.push(record);

    if (record.slug) {
      if (!algoliaBySlug[record.slug]) {
        algoliaBySlug[record.slug] = [];
      }
      algoliaBySlug[record.slug].push(record);
    }
  }

  console.log('\n--- ALGOLIA DUPLICATE ANALYSIS ---');
  console.log(`Total Drafts in Algolia: ${drafts.length}`);
  console.log(`Total Published in Algolia: ${published.length}`);
  
  // Identify slug duplicates
  const slugDuplicates = Object.entries(algoliaBySlug).filter(([slug, records]) => records.length > 1);
  if (slugDuplicates.length > 0) {
    console.log(`\nFound ${slugDuplicates.length} slugs with duplicate records in Algolia:`);
    for (const [slug, records] of slugDuplicates) {
      const draftCount = records.filter(r => r.objectID.startsWith('drafts.')).length;
      const pubCount = records.length - draftCount;
      console.log(`  Slug: ${slug} | Total: ${records.length} (Drafts: ${draftCount}, Published: ${pubCount})`);
      records.forEach(r => console.log(`    - objectID: ${r.objectID}`));
    }
  } else {
    console.log('No duplicate slugs found in Algolia.');
  }

  // 4. Mismatch Analysis (Sanity vs Algolia)
  console.log('\n--- SANITY VS ALGOLIA SYNC CHECK ---');
  const sanityIds = new Set(sanityBlogs.map(b => b._id));
  
  // Published records in Algolia should match Sanity IDs
  const publishedAlgoliaIds = new Set(published.map(r => r.objectID));
  const missingInAlgolia = sanityBlogs.filter(b => !publishedAlgoliaIds.has(b._id));
  const extraInAlgolia = published.filter(r => !sanityIds.has(r.objectID));

  if (missingInAlgolia.length > 0) {
    console.log(`\nSanity blogs NOT in Algolia (Published): ${missingInAlgolia.length}`);
    // Show a few
    missingInAlgolia.slice(0, 5).forEach(b => console.log(`  - ${b.title} (${b._id})`));
    if (missingInAlgolia.length > 5) console.log('    ...');
  } else {
    console.log('All Sanity blogs are present as published records in Algolia.');
  }

  if (extraInAlgolia.length > 0) {
    console.log(`\nPublished Algolia records NOT in Sanity (Orphans): ${extraInAlgolia.length}`);
    extraInAlgolia.forEach(r => console.log(`  - ${r.title} (objectID: ${r.objectID})`));
  } else {
    console.log('No orphaned published records in Algolia.');
  }

  console.log('\n--- SUMMARY ---');
  console.log('The primary issue is that Algolia contains BOTH "drafts.*" and published records from Sanity.');
  console.log('This causes duplicates in search results.');
  console.log('Expected behavior: Algolia should only contain published records.');

  console.log('\n--- END OF REPORT ---');
}

checkDuplicates().catch(console.error);
