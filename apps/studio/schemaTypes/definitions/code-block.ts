import { CodeIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

export const codeBlock = defineType({
  name: "codeBlock",
  title: "Code Block",
  type: "object",
  icon: CodeIcon,
  fields: [
    defineField({
      name: "language",
      title: "Language",
      type: "string",
    }),
    defineField({
      name: "code",
      title: "Code",
      type: "text",
    }),
    defineField({
      name: "filename",
      title: "Filename",
      type: "string",
    }),
  ],
  preview: {
    select: {
      language: "language",
      code: "code",
    },
    prepare: ({ language, code }) => ({
      title: `${language || "Code"} Block`,
      subtitle: code ? `${code.slice(0, 50)}...` : "Empty code block",
    }),
  },
});
