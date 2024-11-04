import {
  DefaultInlineContentSchema,
  DefaultStyleSchema,
} from "@blocknote/core";
import { InlineContentMapping } from "@blocknote/core/src/exporter/mapping.js";
import { ExternalHyperlink, ParagraphChild, TextRun } from "docx";
import type { DOCXExporter } from "../docxExporter.js";

export const docxInlineContentMappingForDefaultSchema: InlineContentMapping<
  DefaultInlineContentSchema,
  DefaultStyleSchema,
  ParagraphChild,
  TextRun
> = {
  link: (ic, exporter) => {
    return new ExternalHyperlink({
      children: ic.content.map((content) => {
        return (exporter as DOCXExporter<any, any, any>).transformStyledText(
          content,
          true
        );
      }),
      link: ic.href,
    });
  },
  text: (ic, t) => {
    return t.transformStyledText(ic);
  },
};