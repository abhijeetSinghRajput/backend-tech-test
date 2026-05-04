// migrate-notehub-to-sanity.mjs
import { createClient } from "@sanity/client";
import { JSDOM } from "jsdom";
import { htmlToBlocks } from "@portabletext/block-tools";
import { Schema } from "@sanity/schema";
import { v4 as uuidv4 } from "uuid";

// ─── Sanity Client ───────────────────────────────────────────────
const sanity = createClient({
  projectId: "whxgudbc", // your project id
  dataset: "production",
  token: "skTSfYaOqfUmSzu58lu3QQimuYRNd11LLh2XA6eHBwMvwYhhcQkt4CkRJ42voeF1DVizInAj4rH1nnvWkeGhSxgPl36mQHk40elhraUVP3lh4VFVMKcaz2KLeoZmsQgVTFkELHP69CFgiEIl83bssDccFUxrTxgwsU51MJZksVgMmWCoAw08", // add token here
  useCdn: false,
  apiVersion: "2025-01-01",
});

// ─── Default Author ───────────────────────────────────────────────
const DEFAULT_AUTHOR_ID = "52e9cc1b-f92a-4957-ae39-02686839806c";

// ─── Schema (matches your richText field exactly) ─────────────────
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
      name: "richText",
      title: "Rich Text",
      type: "array",
      of: [{ type: "block" }],
    },
  ],
});

const blockContentType = defaultSchema.get("richText"); // ✅ array type

// ─── HTML → Portable Text ─────────────────────────────────────────
function convertHtmlToPortableText(html) {
  if (!html) return [];

  try {
    const dom = new JSDOM("");
    return htmlToBlocks(html, blockContentType, {
      parseHtml: (h) => new JSDOM(h).window.document,
    });
  } catch (err) {
    console.warn("⚠️ HTML conversion failed, using plain text fallback:", err.message);
    // fallback: plain paragraph
    const text = html.replace(/<[^>]*>/g, "").trim();
    return text
      ? [
          {
            _type: "block",
            _key: uuidv4().replace(/-/g, "").slice(0, 12),
            style: "normal",
            children: [
              {
                _type: "span",
                _key: uuidv4().replace(/-/g, "").slice(0, 12),
                marks: [],
                text,
              },
            ],
            markDefs: [],
          },
        ]
      : [];
  }
}

// ─── Strip HTML for plain text fields ────────────────────────────
function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, "").trim();
}

// ─── OG Image URL ────────────────────────────────────────────────
function generateOG(note) {
  const author = note.userId || {};
  const params = new URLSearchParams({
    title: note.name || "Untitled Note",
    collection: note.collectionId?.name || "General",
    authorName: author.fullName || "Anonymous",
    authorUsername: `@${author.userName || "anonymous"}`,
    authorAvatar: author.avatar || "https://placehold.net/avatar.png",
  });
  return `https://notehub-official.vercel.app/api/og-note?${params.toString()}`;
}

// ─── Description (140–160 chars) ─────────────────────────────────
function buildDescription(note) {
  const raw = stripHtml(note.content || note.name || "No description");
  // pad if too short, trim if too long
  let desc = raw.slice(0, 160);
  if (desc.length < 140) {
    desc = desc.padEnd(140, " ").trimEnd() + ".";
  }
  return desc.slice(0, 160);
}

// ─── Transform Note → Sanity Blog doc ────────────────────────────
function transform(note) {
  const slug = note.slug || note._id;

  return {
    _type: "blog",
    title: note.name || "Untitled",

    description: buildDescription(note),

    slug: {
      _type: "slug",
      current: slug,
    },

    publishedAt: note.createdAt
      ? note.createdAt.split("T")[0]
      : new Date().toISOString().split("T")[0],

    authors: [
      {
        _key: uuidv4().replace(/-/g, "").slice(0, 12),
        _type: "reference",
        _ref: DEFAULT_AUTHOR_ID,
      },
    ],

    image: {
      _type: "image",
      alt: note.name || "Blog image",
    },

    richText: convertHtmlToPortableText(note.content || ""),

    seoTitle: (note.name || "").slice(0, 60),
    seoDescription: stripHtml(note.content || "").slice(0, 160),
    seoNoIndex: false,
    seoHideFromLists: false,

    ogImage: generateOG(note),
  };
}

// ─── Fetch all notes ──────────────────────────────────────────────
async function fetchNotes() {
  const res = await fetch("https://notehub-38kp.onrender.com/api/note?limit=100");
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data.notes;
}

// ─── Migrate ──────────────────────────────────────────────────────
async function migrate() {
  const notes = await fetchNotes();
  console.log(`Found ${notes.length} notes\n`);

  let success = 0;
  let failed = 0;

  for (const note of notes) {
    const doc = transform(note);

    try {
      await sanity.create(doc); // use create as requested
      console.log(`✅ Uploaded: ${doc.title}`);
      success++;
    } catch (err) {
      console.error(`❌ Failed:   ${doc.title}`);
      console.error(`   Reason:   ${err.message}\n`);
      failed++;
    }
  }

  console.log(`\n🎉 Done — ${success} uploaded, ${failed} failed`);
}

migrate();