import { DOMSerializer, Fragment } from "prosemirror-model";

import type { BlockNoteEditor } from "../../../../editor/BlockNoteEditor";

import { Block } from "../../../../../types/src";
import { PartialBlock } from "../../../../blocks/defaultBlocks";
import {
  BlockSchema,
  InlineContentSchema,
  StyleSchema,
} from "../../../../schema";
import { UnreachableCaseError } from "../../../../util/typescript";
import {
  inlineContentToNodes,
  tableContentToNodes,
} from "../../../nodeConversions/nodeConversions";

export function serializeInlineContent<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema
>(
  editor: BlockNoteEditor<any, I, S>,
  blockContent: Block<BSchema, I, S>["content"],
  serializer: DOMSerializer,
  toExternalHTML: boolean, // TODO, externalHTML for IC
  options?: { document?: Document }
) {
  let nodes: any;

  if (!blockContent) {
    throw new Error("blockContent is required");
  } else if (typeof blockContent === "string") {
    nodes = inlineContentToNodes(
      [blockContent],
      editor.pmSchema,
      editor.schema.styleSchema
    );
  } else if (Array.isArray(blockContent)) {
    nodes = inlineContentToNodes(
      blockContent,
      editor.pmSchema,
      editor.schema.styleSchema
    );
  } else if (blockContent.type === "tableContent") {
    nodes = tableContentToNodes(
      blockContent,
      editor.pmSchema,
      editor.schema.styleSchema
    );
  } else {
    throw new UnreachableCaseError(blockContent.type);
  }

  const dom = serializer.serializeFragment(Fragment.from(nodes), options);
  // const parent = document.createElement("div");
  // parent.appendChild(dom);

  // console.error(dom.children);
  console.error(dom.firstChild?.nodeName);
  return dom.cloneNode(true);
}

function serializeBlock<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema
>(
  editor: BlockNoteEditor<BSchema, I, S>,
  block: PartialBlock<BSchema, I, S>,
  serializer: DOMSerializer,
  toExternalHTML: boolean,
  options?: { document?: Document }
) {
  const BC_NODE = editor.pmSchema.nodes["blockContainer"];
  const BG_NODE = editor.pmSchema.nodes["blockGroup"];

  let props = block.props;
  // set default props in case we were passed a partial block
  if (!block.props) {
    props = {};
    for (const [name, spec] of Object.entries(
      editor.schema.blockSchema[block.type as any].propSchema
    )) {
      (props as any)[name] = spec.default;
    }
  }

  const bc = BC_NODE.spec?.toDOM?.(
    BC_NODE.create({
      id: block.id,
      ...props,
    })
  ) as {
    dom: HTMLElement;
    contentDOM?: HTMLElement;
  };

  const impl = editor.blockImplementations[block.type as any].implementation;
  const ret = toExternalHTML
    ? impl.toExternalHTML({ ...block, props } as any, editor as any)
    : impl.toInternalHTML({ ...block, props } as any, editor as any);

  if (ret.contentDOM && block.content) {
    const ic = serializeInlineContent(
      editor,
      block.content as any, // TODO
      serializer,
      toExternalHTML,
      options
    );
    ret.contentDOM.appendChild(ic);
  }

  bc.contentDOM?.appendChild(ret.dom);

  if (block.children && block.children.length > 0) {
    const bg = BG_NODE.spec?.toDOM?.(
      BG_NODE.create({
        type: BG_NODE,
        attrs: {},
      })
    ) as {
      dom: HTMLElement;
      contentDOM?: HTMLElement;
    };

    for (const child of block.children || []) {
      const childDOM = serializeBlock(
        editor,
        child,
        serializer,
        toExternalHTML,
        options
      );
      bg.contentDOM?.appendChild(childDOM);
    }

    bc.contentDOM?.appendChild(bg.dom);
  }
  return bc.dom;
}

export const serializeBlocks = <
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema
>(
  editor: BlockNoteEditor<BSchema, I, S>,
  blocks: PartialBlock<BSchema, I, S>[],
  serializer: DOMSerializer,
  toExternalHTML: boolean,
  options?: { document?: Document }
) => {
  const BG_NODE = editor.pmSchema.nodes["blockGroup"];

  const bg = BG_NODE.spec!.toDOM!(BG_NODE.create({})) as {
    dom: HTMLElement;
    contentDOM?: HTMLElement;
  };

  for (const block of blocks) {
    const blockDOM = serializeBlock(
      editor,
      block,
      serializer,
      toExternalHTML,
      options
    );
    bg.contentDOM!.appendChild(blockDOM);
  }

  return bg.dom;
};
