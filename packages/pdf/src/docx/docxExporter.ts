import {
  Block,
  BlockNoteSchema,
  BlockSchema,
  COLORS_DEFAULT,
  InlineContentSchema,
  StyleSchema,
  StyledText,
} from "@blocknote/core";
import {
  AlignmentType,
  Document,
  IRunPropertiesOptions,
  LevelFormat,
  Packer,
  Paragraph,
  ParagraphChild,
  Tab,
  Table,
  TextRun,
} from "docx";

import { Exporter, ExporterOptions } from "../Exporter.js";
import { loadFileBuffer } from "../util/fileUtil.js";

const DEFAULT_TAB_STOP = 16 * 0.75 * 1.5 * 20; /* twip */
export class DOCXExporter<
  B extends BlockSchema,
  S extends StyleSchema,
  I extends InlineContentSchema
> extends Exporter<
  B,
  I,
  S,
  Promise<Paragraph[] | Paragraph | Table> | Paragraph[] | Paragraph | Table,
  ParagraphChild,
  IRunPropertiesOptions,
  TextRun
> {
  public constructor(
    public readonly schema: BlockNoteSchema<B, I, S>,
    public readonly mappings: Exporter<
      NoInfer<B>,
      NoInfer<I>,
      NoInfer<S>,
      | Promise<Paragraph[] | Paragraph | Table>
      | Paragraph[]
      | Paragraph
      | Table,
      ParagraphChild,
      IRunPropertiesOptions,
      TextRun
    >["mappings"],
    options?: Partial<ExporterOptions>
  ) {
    const defaults = {
      colors: COLORS_DEFAULT,
    } satisfies Partial<ExporterOptions>;

    const newOptions = {
      ...defaults,
      ...options,
    };
    super(schema, mappings, newOptions);
  }

  public transformStyledText(styledText: StyledText<S>, hyperlink?: boolean) {
    const stylesArray = this.mapStyles(styledText.styles);

    const styles: IRunPropertiesOptions = Object.assign(
      {} as IRunPropertiesOptions,
      ...stylesArray
    );

    return new TextRun({
      ...styles,
      style: hyperlink ? "Hyperlink" : undefined, // TODO: add style?
      text: styledText.text,
    });
  }

  public async transformBlocks(
    blocks: Block<B, I, S>[],
    nestingLevel = 0
  ): Promise<Array<Paragraph | Table>> {
    const ret: Array<Paragraph | Table> = [];

    for (const b of blocks) {
      let children = await this.transformBlocks(b.children, nestingLevel + 1);
      children = children.map((c, _i) => {
        // TODO: nested tables not supported
        if (
          c instanceof Paragraph &&
          !(c as any).properties.numberingReferences.length
        ) {
          c.addRunToFront(
            new TextRun({
              children: [new Tab()],
            })
          );
        }
        return c;
      });
      const self = await this.mapBlock(b as any, nestingLevel, 0 /*unused*/); // TODO: any
      if (Array.isArray(self)) {
        ret.push(...self, ...children);
      } else {
        ret.push(self, ...children);
      }
    }
    return ret;
  }

  public async getFonts(): Promise<
    ConstructorParameters<typeof Document>[0]["fonts"]
  > {
    // Unfortunately, loading the variable font doesn't work
    // "./src/fonts/Inter-VariableFont_opsz,wght.ttf",

    let font = await loadFileBuffer(
      await import("../fonts/inter/Inter_18pt-Regular.ttf")
    );

    if (font instanceof ArrayBuffer) {
      // conversionw with Polyfill needed because docxjs requires Buffer
      const Buffer = (await import("buffer")).Buffer;
      font = Buffer.from(font);
    }

    return [{ name: "Inter", data: font as Buffer }];
  }

  public async createDocumentProperties(): Promise<
    // get constructor arg type from Document
    Partial<ConstructorParameters<typeof Document>[0]>
  > {
    const externalStyles = (await import("./template/word/styles.xml?raw"))
      .default;

    const bullets = ["•"]; //, "◦", "▪"]; (these don't look great, just use solid bullet for now)
    return {
      numbering: {
        config: [
          {
            reference: "blocknote-numbered-list",
            levels: Array.from({ length: 9 }, (_, i) => ({
              start: 1,
              level: i,
              format: LevelFormat.DECIMAL,
              text: `%${i + 1}.`,
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left: DEFAULT_TAB_STOP * (i + 1),
                    hanging: DEFAULT_TAB_STOP,
                  },
                },
              },
            })),
          },
          {
            reference: "blocknote-bullet-list",
            levels: Array.from({ length: 9 }, (_, i) => ({
              start: 1,
              level: i,
              format: LevelFormat.BULLET,
              text: bullets[i % bullets.length],
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left: DEFAULT_TAB_STOP * (i + 1),
                    hanging: DEFAULT_TAB_STOP,
                  },
                },
              },
            })),
          },
        ],
      },

      fonts: await this.getFonts(),
      defaultTabStop: 200,
      externalStyles,
    };
  }

  public async toBlob(blocks: Block<B, I, S>[]) {
    const doc = await this.toDocxJsDocument(blocks);
    const prevBuffer = globalThis.Buffer;
    try {
      if (!globalThis.Buffer) {
        // load Buffer polyfill because docxjs requires this
        globalThis.Buffer = (await import("buffer")).Buffer;
      }
      return Packer.toBlob(doc);
    } finally {
      globalThis.Buffer = prevBuffer;
    }
  }

  public async toDocxJsDocument(blocks: Block<B, I, S>[]) {
    const doc = new Document({
      ...(await this.createDocumentProperties()),
      sections: [
        {
          properties: {},
          children: await this.transformBlocks(blocks),
        },
      ],
    });

    // fix https://github.com/dolanmiu/docx/pull/2800/files
    doc.Document.Relationships.createRelationship(
      doc.Document.Relationships.RelationshipCount + 1,
      "http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable",
      "fontTable.xml"
    );

    return doc;
  }
}