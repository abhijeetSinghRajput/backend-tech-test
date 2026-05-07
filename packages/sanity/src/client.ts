import type { SanityImageSource } from "@sanity/asset-utils";
import { createImageUrlBuilder } from "@sanity/image-url";
import { env } from "@workspace/env/client";
import { createClient } from "next-sanity";

export const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION,
  useCdn: env.NODE_ENV === "production",
  perspective: "published",
  stega: {
    studioUrl: env.NEXT_PUBLIC_SANITY_STUDIO_URL,
    enabled: env.NEXT_PUBLIC_VERCEL_ENV === "preview",
  },
});

const imageBuilder = createImageUrlBuilder({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
});

export const urlFor = (source: any) => {
  if (source?.id && !source.asset) {
    return imageBuilder
      .image({
        _type: "image",
        asset: {
          _ref: source.id,
          _type: "reference",
        },
      })
      .auto("format")
      .quality(80)
      .format("webp");
  }
  return imageBuilder.image(source).auto("format").quality(80).format("webp");
};
