import * as ShadCNInput from "../components/ui/input";

import { ComponentProps } from "@blocknote/react";
import { forwardRef } from "react";

import { useShadCNComponentsContext } from "../ShadCNComponentsContext";

export const PanelTextInput = forwardRef<
  HTMLInputElement,
  ComponentProps["ImagePanel"]["TextInput"]
>((props, ref) => {
  const { className, value, placeholder, onKeyDown, onChange } = props;

  const ShadCNComponents = useShadCNComponentsContext();
  const Input = ShadCNComponents?.Input || ShadCNInput.Input;

  return (
    <Input
      data-test={"embed-input"}
      className={className}
      ref={ref}
      value={value}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      onChange={onChange}
    />
  );
});