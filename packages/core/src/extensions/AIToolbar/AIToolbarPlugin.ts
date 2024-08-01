import { Plugin, PluginKey, PluginView } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { BlockInfo, getBlockInfoFromPos } from "../../api/getBlockInfoFromPos";
import { UiElementPosition } from "../../extensions-shared/UiElementPosition";
import { EventEmitter } from "../../util/EventEmitter";

export type AIToolbarState = UiElementPosition & { prompt?: string };

export class AIToolbarView implements PluginView {
  public state?: AIToolbarState;
  public emitUpdate: () => void;

  public oldBlockInfo: BlockInfo | undefined;
  public domElement: HTMLElement | undefined;

  constructor(
    private readonly pmView: EditorView,
    emitUpdate: (state: AIToolbarState) => void
  ) {
    this.emitUpdate = () => {
      if (!this.state) {
        throw new Error("Attempting to update uninitialized AI toolbar");
      }

      emitUpdate(this.state);
    };

    pmView.dom.addEventListener("dragstart", this.dragHandler);
    pmView.dom.addEventListener("dragover", this.dragHandler);
    pmView.dom.addEventListener("blur", this.blurHandler);

    // Setting capture=true ensures that any parent container of the editor that
    // gets scrolled will trigger the scroll event. Scroll events do not bubble
    // and so won't propagate to the document by default.
    pmView.root.addEventListener("scroll", this.scrollHandler, true);
  }

  blurHandler = (event: FocusEvent) => {
    const editorWrapper = this.pmView.dom.parentElement!;

    // Checks if the focus is moving to an element outside the editor. If it is,
    // the toolbar is hidden.
    if (
      // An element is clicked.
      event &&
      event.relatedTarget &&
      // Element is inside the editor.
      (editorWrapper === (event.relatedTarget as Node) ||
        editorWrapper.contains(event.relatedTarget as Node) ||
        (event.relatedTarget as HTMLElement).matches(
          ".bn-ui-container, .bn-ui-container *"
        ))
    ) {
      return;
    }

    if (this.state?.show) {
      this.state.show = false;
      this.emitUpdate();
    }
  };

  // For dragging the whole editor.
  dragHandler = () => {
    if (this.state?.show) {
      this.state.show = false;
      this.emitUpdate();
    }
  };

  scrollHandler = () => {
    if (this.state?.show) {
      this.state.referencePos = this.domElement!.getBoundingClientRect();
      this.emitUpdate();
    }
  };

  update(view: EditorView) {
    const blockInfo = getBlockInfoFromPos(
      view.state.doc,
      view.state.selection.from
    );

    // Return if the selection remains in a non-AI block.
    if (
      blockInfo.contentType.name !== "ai" &&
      this.oldBlockInfo?.contentType.name !== "ai"
    ) {
      this.oldBlockInfo = blockInfo;
      return;
    }

    this.oldBlockInfo = blockInfo;

    // Selection is in an AI block that wasn't previously selected.
    if (
      blockInfo.contentType.name === "ai" &&
      blockInfo.contentNode.attrs.prompt !== "" &&
      view.state.selection.$from.sameParent(view.state.selection.$to)
    ) {
      this.domElement = view.domAtPos(blockInfo.startPos).node
        .firstChild as HTMLElement;

      this.state = {
        prompt: blockInfo.contentNode.attrs.prompt,
        show: true,
        referencePos: this.domElement.getBoundingClientRect(),
      };

      this.emitUpdate();

      return;
    }

    // Selection is not in an AI block but previously was in one.
    if (this.state?.show) {
      this.state.show = false;
      this.emitUpdate();
    }
  }

  destroy() {
    this.pmView.dom.removeEventListener("dragstart", this.dragHandler);
    this.pmView.dom.removeEventListener("dragover", this.dragHandler);
    this.pmView.dom.removeEventListener("blur", this.blurHandler);

    this.pmView.root.removeEventListener("scroll", this.scrollHandler, true);
  }

  closeMenu = () => {
    if (this.state?.show) {
      this.state.show = false;
      this.emitUpdate();
    }
  };
}

export const aiToolbarPluginKey = new PluginKey("AIToolbarPlugin");

export class AIToolbarProsemirrorPlugin extends EventEmitter<any> {
  private view: AIToolbarView | undefined;
  public readonly plugin: Plugin;

  constructor() {
    super();
    this.plugin = new Plugin({
      key: aiToolbarPluginKey,
      view: (editorView) => {
        this.view = new AIToolbarView(editorView, (state) => {
          this.emit("update", state);
        });
        return this.view;
      },
    });
  }

  public get shown() {
    return this.view?.state?.show || false;
  }

  public onUpdate(callback: (state: AIToolbarState) => void) {
    return this.on("update", callback);
  }

  public closeMenu = () => this.view!.closeMenu();
}