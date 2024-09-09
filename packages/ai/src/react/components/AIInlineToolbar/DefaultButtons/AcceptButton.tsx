import { useComponentsContext, useDictionary } from "@blocknote/react";
import { RiCheckFill } from "react-icons/ri";

import { useBlockNoteEditor } from "../../../hooks/useBlockNoteEditor";

export const AcceptButton = () => {
  const dict = useDictionary();
  const Components = useComponentsContext()!;

  const editor = useBlockNoteEditor<any, any, any>();

  if (!editor.isEditable) {
    return null;
  }

  return (
    <Components.AIInlineToolbar.Button
      className={"bn-button"}
      icon={<RiCheckFill />}
      mainTooltip={dict.ai_inline_toolbar.accept}
      label={dict.ai_inline_toolbar.accept}
      onClick={() => editor.aiInlineToolbar.close()}
    />
  );
};
