const path = require('path');
const { createClient } = require('@sanity/client');
require('dotenv').config({ path: path.resolve(__dirname, '../apps/studio/.env') });

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  token: process.env.SANITY_STUDIO_API_WRITE_TOKEN,
  useCdn: false,
  apiVersion: '2023-05-03',
});

const authors = [
  '52e9cc1b-f92a-4957-ae39-02686839806c', // Abhijeet Singh Rajput
  'd1f45b39-8694-460a-8ca8-290ff8e91176', // Ashutosh Kumar
  'd9b81085-becc-44e7-be74-a2e937718630', // Divya Sachan
  'f72b15e6-422e-4abb-ab5e-2d13e74a88c3'  // Abhishek Singh
];

async function randomizeAuthors() {
  try {
    if (!process.env.SANITY_STUDIO_PROJECT_ID) {
      throw new Error('SANITY_STUDIO_PROJECT_ID is not defined. Check your .env path.');
    }

    console.log(`Targeting Project: ${process.env.SANITY_STUDIO_PROJECT_ID}`);
    console.log('Fetching blog posts...');
    const posts = await client.fetch('*[_type == "blog"]{_id}');
    console.log(`Found ${posts.length} posts.`);

    for (const post of posts) {
      const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
      console.log(`Assigning author to post ${post._id}...`);
      
      await client
        .patch(post._id)
        .set({
          authors: [{
            _key: require('uuid').v4(), // Use uuid v4 for the key
            _type: 'reference',
            _ref: randomAuthor
          }]
        })
        .commit();
    }

    console.log('Successfully randomized all authors!');
  } catch (error) {
    console.error('Error:', error.message || error);
  }
}

randomizeAuthors();

