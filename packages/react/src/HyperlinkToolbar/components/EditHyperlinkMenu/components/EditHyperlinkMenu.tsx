import {
  ChangeEvent,
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { RiLink, RiText } from "react-icons/ri";
import { ToolbarInputDropdown } from "../../../../SharedComponents/Toolbar/components/ToolbarInputDropdown";
import { ToolbarInputDropdownItem } from "../../../../SharedComponents/Toolbar/components/ToolbarInputDropdownItem";

export type EditHyperlinkMenuProps = {
  url: string;
  text: string;
  update: (url: string, text: string) => void;
};

/**
 * Menu which opens when editing an existing hyperlink or creating a new one.
 * Provides input fields for setting the hyperlink URL and title.
 */
export const EditHyperlinkMenu = forwardRef<
  HTMLDivElement,
  EditHyperlinkMenuProps & HTMLAttributes<HTMLDivElement>
>(({ url, text, update, ...props }, ref) => {
  const [currentUrl, setCurrentUrl] = useState<string>(url);
  const [currentText, setCurrentText] = useState<string>(text);

  useEffect(() => {
    setCurrentUrl(url);
    setCurrentText(text);
  }, [text, url]);

  const handleEnter = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        update(currentUrl, currentText);
      }
    },
    [update, currentUrl, currentText]
  );

  const handleUrlChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setCurrentUrl(event.currentTarget.value),
    []
  );

  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setCurrentText(event.currentTarget.value),
    []
  );

  const handleSubmit = useCallback(
    () => update(currentUrl, currentText),
    [update, currentUrl, currentText]
  );

  return (
    <ToolbarInputDropdown {...props} ref={ref}>
      <ToolbarInputDropdownItem
        icon={RiLink}
        mainTooltip={"Edit URL"}
        inputProps={{
          autoFocus: true,
          placeholder: "Edit URL",
          value: currentUrl,
          onKeyDown: handleEnter,
          onChange: handleUrlChange,
          onSubmit: handleSubmit,
        }}
      />
      <ToolbarInputDropdownItem
        icon={RiText}
        mainTooltip={"Edit Title"}
        inputProps={{
          placeholder: "Edit Title",
          value: currentText,
          onKeyDown: handleEnter,
          onChange: handleTextChange,
          onSubmit: handleSubmit,
        }}
      />
    </ToolbarInputDropdown>
  );
});
