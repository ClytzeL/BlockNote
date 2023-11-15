import { Extensions, extensions } from "@tiptap/core";

import { Bold } from "@tiptap/extension-bold";
import { Code } from "@tiptap/extension-code";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { HardBreak } from "@tiptap/extension-hard-break";
import { History } from "@tiptap/extension-history";
import { Italic } from "@tiptap/extension-italic";
import { Link } from "@tiptap/extension-link";
import { Strike } from "@tiptap/extension-strike";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableRow } from "@tiptap/extension-table-row";
import { Text } from "@tiptap/extension-text";
import { Underline } from "@tiptap/extension-underline";
import * as Y from "yjs";
import { BlockNoteEditor } from "./BlockNoteEditor";
import styles from "./editor.module.css";
import { BackgroundColorExtension } from "./extensions/BackgroundColor/BackgroundColorExtension";
import { BackgroundColorMark } from "./extensions/BackgroundColor/BackgroundColorMark";
import { blocks } from "./extensions/Blocks";
import { BlockSchema } from "./extensions/Blocks/api/blockTypes";
import { CustomBlockSerializerExtension } from "./extensions/Blocks/api/serialization";
import blockStyles from "./extensions/Blocks/nodes/Block.module.css";

import TableHeader from "@tiptap/extension-table-header";
import { Placeholder } from "./extensions/Placeholder/PlaceholderExtension";
import { TextAlignmentExtension } from "./extensions/TextAlignment/TextAlignmentExtension";
import { TextColorExtension } from "./extensions/TextColor/TextColorExtension";
import { TextColorMark } from "./extensions/TextColor/TextColorMark";
import { TrailingNode } from "./extensions/TrailingNode/TrailingNodeExtension";
import UniqueID from "./extensions/UniqueID/UniqueID";

/**
 * Get all the Tiptap extensions BlockNote is configured with by default
 */
export const getBlockNoteExtensions = <BSchema extends BlockSchema>(opts: {
  editor: BlockNoteEditor<BSchema>;
  blockSchema: BSchema;
  collaboration?: {
    fragment: Y.XmlFragment;
    user: {
      name: string;
      color: string;
    };
    provider: any;
    renderCursor?: (user: any) => HTMLElement;
  };
}) => {
  const ret: Extensions = [
    extensions.ClipboardTextSerializer,
    extensions.Commands,
    extensions.Editable,
    extensions.FocusEvents,
    extensions.Tabindex,

    // DevTools,
    Gapcursor,

    // DropCursor,
    Placeholder.configure({
      emptyNodeClass: blockStyles.isEmpty,
      hasAnchorClass: blockStyles.hasAnchor,
      isFilterClass: blockStyles.isFilter,
      includeChildren: true,
      showOnlyCurrent: false,
    }),
    UniqueID.configure({
      types: ["blockContainer"],
    }),
    HardBreak,
    // Comments,

    // basics:
    Text,

    // marks:
    Bold,
    Code,
    Italic,
    Strike,
    Underline,
    Link,
    TextColorMark,
    TextColorExtension,
    BackgroundColorMark,
    BackgroundColorExtension,
    TextAlignmentExtension,

    // custom blocks:
    ...blocks,
    ...Object.values(opts.blockSchema).map((blockSpec) =>
      blockSpec.node.configure({ editor: opts.editor })
    ),
    CustomBlockSerializerExtension,

    Dropcursor.configure({ width: 5, color: "#ddeeff" }),
    // This needs to be at the bottom of this list, because Key events (such as enter, when selecting a /command),
    // should be handled before Enter handlers in other components like splitListItem
    TrailingNode,
    TableCell.extend({
      content: "paragraph",
      // addNodeView() {
      //   return (props) => {
      //     debugger;
      //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
      //     // if (!(props.editor as any).contentComponent) {
      //     //   // same logic as in ReactNodeViewRenderer
      //     //   return {};
      //     // }

      //     const ret = ReactNodeViewRenderer(<div>hello</div>, {
      //       stopEvent: () => true,
      //     })(props) as NodeView;
      //     return ret;
      //   };
      // },
    }),
    TableHeader.extend({
      content: "paragraph",
    }),
    TableRow.extend({
      allowGapCursor: false,
    }),
  ];

  if (opts.collaboration) {
    ret.push(
      Collaboration.configure({
        fragment: opts.collaboration.fragment,
      })
    );
    const defaultRender = (user: { color: string; name: string }) => {
      const cursor = document.createElement("span");

      cursor.classList.add(styles["collaboration-cursor__caret"]);
      cursor.setAttribute("style", `border-color: ${user.color}`);

      const label = document.createElement("span");

      label.classList.add(styles["collaboration-cursor__label"]);
      label.setAttribute("style", `background-color: ${user.color}`);
      label.insertBefore(document.createTextNode(user.name), null);

      const nonbreakingSpace1 = document.createTextNode("\u2060");
      const nonbreakingSpace2 = document.createTextNode("\u2060");
      cursor.insertBefore(nonbreakingSpace1, null);
      cursor.insertBefore(label, null);
      cursor.insertBefore(nonbreakingSpace2, null);
      return cursor;
    };
    ret.push(
      CollaborationCursor.configure({
        user: opts.collaboration.user,
        render: opts.collaboration.renderCursor || defaultRender,
        provider: opts.collaboration.provider,
      })
    );
  } else {
    // disable history extension when collaboration is enabled as Yjs takes care of undo / redo
    ret.push(History);
  }

  return ret;
};
