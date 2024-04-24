import {
  BlockNoteViewRaw,
  Components,
  ComponentsContext,
} from "@blocknote/react";
import { ComponentProps } from "react";

import { TextInput } from "./form/TextInput";
import {
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTrigger,
} from "./menu/Menu";
import { Panel } from "./panel/Panel";
import { PanelButton } from "./panel/PanelButton";
import { PanelFileInput } from "./panel/PanelFileInput";
import { PanelTab } from "./panel/PanelTab";
import { PanelTextInput } from "./panel/PanelTextInput";
import { SideMenu } from "./sideMenu/SideMenu";
import { SideMenuButton } from "./sideMenu/SideMenuButton";
import { SuggestionMenu } from "./suggestionMenu/SuggestionMenu";
import { SuggestionMenuItem } from "./suggestionMenu/SuggestionMenuItem";
import { SuggestionMenuEmptyItem } from "./suggestionMenu/SuggestionMenuEmptyItem";
import { SuggestionMenuLabel } from "./suggestionMenu/SuggestionMenuLabel";
import { SuggestionMenuLoader } from "./suggestionMenu/SuggestionMenuLoader";
import {
  ShadCNComponentsContext,
  ShadCNComponents,
} from "./ShadCNComponentsContext";
import { Toolbar, ToolbarButton, ToolbarSelect } from "./toolbar/Toolbar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";

import "./style.css";

export const components: Components = {
  FormattingToolbar: {
    Root: Toolbar,
    Button: ToolbarButton,
    Select: ToolbarSelect,
  },
  ImagePanel: {
    Root: Panel,
    Button: PanelButton,
    FileInput: PanelFileInput,
    TabPanel: PanelTab,
    TextInput: PanelTextInput,
  },
  LinkToolbar: {
    Root: Toolbar,
    Button: ToolbarButton,
  },
  SideMenu: {
    Root: SideMenu,
    Button: SideMenuButton,
  },
  SuggestionMenu: {
    Root: SuggestionMenu,
    Item: SuggestionMenuItem,
    EmptyItem: SuggestionMenuEmptyItem,
    Label: SuggestionMenuLabel,
    Loader: SuggestionMenuLoader,
  },
  Generic: {
    Form: {
      Root: (props) => <div>{props.children}</div>,
      TextInput: TextInput,
    },
    Menu: {
      Root: Menu,
      Trigger: MenuTrigger,
      Dropdown: MenuDropdown,
      Divider: MenuDivider,
      Label: MenuLabel,
      Item: MenuItem,
    },
    Popover: {
      Root: Popover,
      Trigger: PopoverTrigger,
      Content: PopoverContent,
    },
  },
};

export const BlockNoteView = (
  // TODO: Fix typing
  props: ComponentProps<typeof BlockNoteViewRaw<any, any, any>> & {
    shadCNComponents?: Partial<ShadCNComponents>;
  }
) => {
  const { shadCNComponents, ...rest } = props;

  return (
    <ShadCNComponentsContext.Provider value={shadCNComponents}>
      <ComponentsContext.Provider value={components}>
        <BlockNoteViewRaw {...rest} />
      </ComponentsContext.Provider>
    </ShadCNComponentsContext.Provider>
  );
};