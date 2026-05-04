import { definePlugin } from "sanity";
import { algoliaIndexer } from "../utils/algolia";
import { createClient } from "@sanity/client";

export const algoliaSyncPlugin = definePlugin({
  name: "algolia-sync",
  document: {
    actions: (prev, context) => {
      if (context.schemaType !== "blog") {
        return prev;
      }

      // We wrap the publish action to also sync with Algolia
      return prev.map((originalAction) => {
        if (originalAction.action === "publish") {
          return (props) => {
            const originalResult = originalAction(props);
            return {
              ...originalResult,
              onHandle: async () => {
                if (originalResult.onHandle) {
                  await originalResult.onHandle();
                }
                
                // Trigger Algolia sync
                const client = createClient({
                  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
                  dataset: process.env.SANITY_STUDIO_DATASET,
                  useCdn: false,
                  apiVersion: "2023-01-01",
                  token: process.env.SANITY_STUDIO_API_WRITE_TOKEN, // Need this!
                });

                const doc = await client.getDocument(props.id);
                if (doc) {
                  await algoliaIndexer.update([{
                    operation: "publish",
                    id: props.id,
                  }], (id) => client.fetch(`*[_id == $id][0]`, { id }));
                }
              },
            };
          };
        }
        return originalAction;
      });
    },
  },
});
