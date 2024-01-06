import {
  BlockNoteEditor,
  BlockSchema,
  DefaultBlockSchema,
  SlashMenuProsemirrorPlugin,
  SuggestionsMenuState,
} from "@blocknote/core";
import {
  flip,
  size,
  useFloating,
  useTransitionStyles,
} from "@floating-ui/react";
import { FC, useEffect, useRef, useState } from "react";

import { ReactSlashMenuItem } from "../../slashMenuItems/ReactSlashMenuItem";
import { DefaultSlashMenu } from "./DefaultSlashMenu";

export type SlashMenuProps<BSchema extends BlockSchema = DefaultBlockSchema> =
  Pick<SlashMenuProsemirrorPlugin<BSchema, any, any, any>, "itemCallback"> &
    Pick<
      SuggestionsMenuState<ReactSlashMenuItem<BSchema>>,
      "filteredItems" | "keyboardHoveredItemIndex"
    >;

export const SlashMenuPositioner = <
  BSchema extends BlockSchema = DefaultBlockSchema
>(props: {
  editor: BlockNoteEditor<BSchema, any, any>;
  slashMenu?: FC<SlashMenuProps<BSchema>>;
}) => {
  const [show, setShow] = useState<boolean>(false);
  const [filteredItems, setFilteredItems] =
    useState<ReactSlashMenuItem<BSchema>[]>();
  const [keyboardHoveredItemIndex, setKeyboardHoveredItemIndex] =
    useState<number>();

  const referencePos = useRef<DOMRect>();

  const { refs, update, context, floatingStyles } = useFloating({
    open: show,
    placement: "bottom-start",
    middleware: [
      size({
        apply({ availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            // Minimum acceptable height is 200px.
            // `flip` will then take over.
            height: `${Math.max(200, availableHeight - 10)}px`,
          });
        },
      }),
      flip({
        fallbackStrategy: "initialPlacement",
      }),
    ],
  });

  const { isMounted, styles } = useTransitionStyles(context);

  useEffect(() => {
    return props.editor.slashMenu.onUpdate((slashMenuState) => {
      setShow(slashMenuState.show);
      setFilteredItems(slashMenuState.filteredItems);
      setKeyboardHoveredItemIndex(slashMenuState.keyboardHoveredItemIndex);

      referencePos.current = slashMenuState.referencePos;

      update();
    });
  }, [props.editor, show, update]);

  useEffect(() => {
    refs.setReference({
      getBoundingClientRect: () => referencePos.current!,
    });
  }, [refs]);

  if (!isMounted || !filteredItems || keyboardHoveredItemIndex === undefined) {
    return null;
  }

  const SlashMenu = props.slashMenu || DefaultSlashMenu;

  return (
    <div
      ref={refs.setFloating}
      style={{
        ...styles,
        ...floatingStyles,
        height: "fit-content",
        zIndex: 2000,
      }}>
      <SlashMenu
        filteredItems={filteredItems}
        itemCallback={(item) => props.editor.slashMenu.itemCallback(item)}
        keyboardHoveredItemIndex={keyboardHoveredItemIndex}
      />
    </div>
  );
};
