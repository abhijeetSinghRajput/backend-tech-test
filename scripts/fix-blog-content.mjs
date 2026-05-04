import { createClient } from "@sanity/client";
import { JSDOM } from "jsdom";
import { htmlToBlocks } from "@portabletext/block-tools";
import { Schema } from "@sanity/schema";
import { v4 as uuidv4 } from "uuid";

// ─── Sanity Client ───────────────────────────────────────────────
const sanity = createClient({
  projectId: "whxgudbc",
  dataset: "production",
  token: "skTSfYaOqfUmSzu58lu3QQimuYRNd11LLh2XA6eHBwMvwYhhcQkt4CkRJ42voeF1DVizInAj4rH1nnvWkeGhSxgPl36mQHk40elhraUVP3lh4VFVMKcaz2KLeoZmsQgVTFkELHP69CFgiEIl83bssDccFUxrTxgwsU51MJZksVgMmWCoAw08",
  useCdn: false,
  apiVersion: "2025-01-01",
});

// ─── Schema ───────────────────────────────────────────────────────
const defaultSchema = Schema.compile({
  name: "default",
  types: [
    {
      type: "object",
      name: "span",
      fields: [
        { name: "text", type: "string" },
        { name: "marks", type: "array", of: [{ type: "string" }] },
      ],
    },
    {
      type: "object",
      name: "block",
      fields: [
        {
          name: "style",
          type: "string",
          options: {
            list: [
              { value: "normal" },
              { value: "h1" },
              { value: "h2" },
              { value: "h3" },
              { value: "h4" },
              { value: "h5" },
              { value: "h6" },
              { value: "blockquote" },
            ],
          },
        },
        {
          name: "children",
          type: "array",
          of: [{ type: "span" }],
        },
        {
          name: "markDefs",
          type: "array",
          of: [
            {
              type: "object",
              name: "link",
              fields: [{ name: "href", type: "string" }],
            },
          ],
        },
        { name: "level", type: "number" },
        { name: "listItem", type: "string" },
      ],
    },
    {
      name: "customTable",
      type: "object",
      fields: [
        {
          name: "rows",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                {
                  name: "cells",
                  type: "array",
                  of: [{ type: "string" }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "codeBlock",
      type: "object",
      fields: [
        { name: "code", type: "text" },
        { name: "language", type: "string" },
        { name: "filename", type: "string" },
      ],
    },
    {
      name: "mathBlock",
      type: "object",
      fields: [{ name: "latex", type: "string" }],
    },
    {
      name: "image",
      type: "image",
      fields: [
        { name: "alt", type: "string" },
        { name: "caption", type: "string" },
      ],
    },
    {
      name: "richText",
      title: "Rich Text",
      type: "array",
      of: [
        { type: "block" },
        { type: "customTable" },
        { type: "image" },
        { type: "codeBlock" },
        { type: "mathBlock" },
      ],
    },
    {
      name: "sanity.imageHotspot",
      type: "object",
      fields: [
        { name: "x", type: "number" },
        { name: "y", type: "number" },
        { name: "height", type: "number" },
        { name: "width", type: "number" },
      ],
    },
    {
      name: "sanity.imageCrop",
      type: "object",
      fields: [
        { name: "top", type: "number" },
        { name: "bottom", type: "number" },
        { name: "left", type: "number" },
        { name: "right", type: "number" },
      ],
    },
  ],
});

const blockContentType = defaultSchema.get("richText");

// ─── Image Upload Cache ───────────────────────────────────────────
const imageCache = new Map();

async function uploadImageFromUrl(url) {
  if (imageCache.has(url)) return imageCache.get(url);

  try {
    console.log(`📸 Uploading image: ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const asset = await sanity.assets.upload("image", buffer, {
      filename: url.split("/").pop() || "image.png",
    });

    imageCache.set(url, asset._id);
    return asset._id;
  } catch (err) {
    console.error(`❌ Image upload failed for ${url}:`, err.message);
    return null;
  }
}

// ─── Custom HTML to Blocks Rules ──────────────────────────────────
async function convertHtmlToPortableText(html) {
  if (!html) return [];

  const dom = new JSDOM(html);
  const { document } = dom.window;

  // Pre-process images
  const images = Array.from(document.querySelectorAll("img"));
  const imageMap = new Map();
  for (const img of images) {
    const src = img.getAttribute("src");
    if (src && !src.startsWith("data:")) {
      const assetId = await uploadImageFromUrl(src);
      if (assetId) imageMap.set(src, assetId);
    }
  }

  return htmlToBlocks(html, blockContentType, {
    parseHtml: (h) => new JSDOM(h).window.document,
    rules: [
      {
        deserialize(el, next, blockInstruction) {
          if (el.tagName && el.tagName.toLowerCase() === "table") {
            const rows = Array.from(el.querySelectorAll("tr")).map((tr) => {
              return {
                _key: uuidv4().replace(/-/g, "").slice(0, 12),
                _type: "row",
                cells: Array.from(tr.querySelectorAll("td, th")).map((td) =>
                  td.textContent.trim()
                ),
              };
            });
            return blockInstruction({
              _type: "customTable",
              _key: uuidv4().replace(/-/g, "").slice(0, 12),
              rows,
            });
          }
        },
      },
      {
        deserialize(el, next, blockInstruction) {
          if (el.tagName && el.tagName.toLowerCase() === "img") {
            const src = el.getAttribute("src");
            const assetId = imageMap.get(src);
            if (assetId) {
              return blockInstruction({
                _type: "image",
                _key: uuidv4().replace(/-/g, "").slice(0, 12),
                alt: el.getAttribute("alt") || "",
                asset: {
                  _type: "reference",
                  _ref: assetId,
                },
              });
            }
          }
        },
      },
      {
        deserialize(el, next, blockInstruction) {
          if (el.tagName && el.tagName.toLowerCase() === "pre") {
            const code = el.querySelector("code");
            return blockInstruction({
              _type: "codeBlock",
              _key: uuidv4().replace(/-/g, "").slice(0, 12),
              code: code ? code.textContent : el.textContent,
              language: code?.className?.replace("language-", "") || "text",
            });
          }
        },
      },
      {
        deserialize(el, next, blockInstruction) {
          if (el.getAttribute && el.getAttribute("data-type") === "block-math") {
            return blockInstruction({
              _type: "mathBlock",
              _key: uuidv4().replace(/-/g, "").slice(0, 12),
              latex: el.getAttribute("data-latex"),
            });
          }
        },
      },
    ],
  });
}

// ─── Main Fix Logic ───────────────────────────────────────────────
async function fixBlogs() {
  console.log("🚀 Starting blog fix migration...\n");

  const res = await fetch("https://notehub-38kp.onrender.com/api/note?limit=100");
  const json = await res.json();
  const notes = json.data.notes;
  console.log(`Found ${notes.length} notes in Notehub.`);

  const sanityBlogs = await sanity.fetch(`*[_type == "blog" && _id match "blog-*"]{_id, title, "noteId": string::split(_id, "-")[1]}`);
  console.log(`Found ${sanityBlogs.length} migrated blogs in Sanity.\n`);

  for (const sanityBlog of sanityBlogs) {
    const note = notes.find((n) => n._id === sanityBlog.noteId);
    if (!note) continue;

    console.log(`🛠️ Fixing: ${note.name}`);

    try {
      const richText = await convertHtmlToPortableText(note.content || "");
      
      let mainImageAssetId = null;
      const imagesInContent = note.content.match(/<img[^>]+src="([^">]+)"/);
      if (imagesInContent && imagesInContent[1]) {
        mainImageAssetId = await uploadImageFromUrl(imagesInContent[1]);
      }

      const patch = {
        richText,
      };

      if (mainImageAssetId) {
        patch.image = {
          _type: "image",
          alt: note.name || "Blog image",
          asset: {
            _type: "reference",
            _ref: mainImageAssetId,
          },
        };
      }

      await sanity.patch(sanityBlog._id).set(patch).commit();
      console.log(`✅ Fixed: ${note.name}`);
    } catch (err) {
      console.error(`❌ Failed to fix: ${note.name}`);
      console.error(`   Reason: ${err.message}\n`);
    }
  }

  console.log("\n🎉 All done!");
}

fixBlogs();
