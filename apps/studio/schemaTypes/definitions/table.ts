import { TableIcon } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

export const customTable = defineType({
  name: "customTable",
  title: "Table",
  type: "object",
  icon: TableIcon,
  fields: [
    defineField({
      name: "rows",
      title: "Rows",
      type: "array",
      of: [
        defineArrayMember({
          name: "row",
          title: "Row",
          type: "object",
          fields: [
            defineField({
              name: "cells",
              title: "Cells",
              type: "array",
              of: [defineArrayMember({ type: "string" })],
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      rows: "rows",
    },
    prepare: ({ rows }) => {
      const rowCount = rows?.length || 0;
      const colCount = rows?.[0]?.cells?.length || 0;
      return {
        title: `Table (${rowCount}x${colCount})`,
        subtitle: "Custom Table Block",
      };
    },
  },
});
