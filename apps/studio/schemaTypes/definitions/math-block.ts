import { SigmaIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

export const mathBlock = defineType({
  name: "mathBlock",
  title: "Math Block",
  type: "object",
  icon: SigmaIcon,
  fields: [
    defineField({
      name: "latex",
      title: "LaTeX",
      type: "string",
    }),
  ],
  preview: {
    select: {
      latex: "latex",
    },
    prepare: ({ latex }) => ({
      title: "Math Block",
      subtitle: latex || "Empty math block",
    }),
  },
});
