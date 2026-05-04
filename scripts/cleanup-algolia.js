import algoliasearch from 'algoliasearch';

const APP_ID = 'OQTCEVSCSR';
const API_WRITE_KEY = 'fc33346f446989d7f89e20ebf8f9f78b';
const INDEX_NAME = 'blog_index';

const client = algoliasearch(APP_ID, API_WRITE_KEY);
const index = client.initIndex(INDEX_NAME);

async function cleanupAlgolia() {
  console.log(`--- CLEANING UP ALGOLIA INDEX: ${INDEX_NAME} ---`);

  // 1. Fetch all records to identify drafts and orphans
  console.log('Fetching all records from Algolia...');
  let allRecords = [];
  await index.browseObjects({
    batch: (objects) => {
      allRecords = allRecords.concat(objects);
    }
  });
  console.log(`Found ${allRecords.length} records.`);

  // 2. Identify records to delete
  // Drafts: objectID starts with 'drafts.'
  // Orphans: identified in previous report (hardcoding for safety or identifying by comparison)
  // For now, I'll delete ALL drafts.
  const objectIDsToDelete = allRecords
    .filter(r => r.objectID.startsWith('drafts.'))
    .map(r => r.objectID);

  // Also add the orphans found in the report
  const orphans = [
    'Vj73MIb9L4dXozmaQiQKWN', // #CheckList for Xml Pojects
    'Vj73MIb9L4dXozmaQiQKJb'  // #Pointers and Reference variable
  ];
  
  for (const orphan of orphans) {
    if (allRecords.find(r => r.objectID === orphan)) {
      objectIDsToDelete.push(orphan);
    }
  }

  if (objectIDsToDelete.length === 0) {
    console.log('No records found to delete.');
    return;
  }

  console.log(`Identified ${objectIDsToDelete.length} records to delete (Drafts + Orphans).`);
  console.log('Sample IDs:', objectIDsToDelete.slice(0, 5).join(', '), '...');

  // 3. Perform deletion
  const confirm = true; // Hardcoded for this task execution
  if (confirm) {
    console.log('Deleting records...');
    const { objectIDs } = await index.deleteObjects(objectIDsToDelete);
    console.log(`Successfully deleted ${objectIDs.length} records.`);
  }

  console.log('\n--- CLEANUP COMPLETE ---');
}

cleanupAlgolia().catch(console.error);
