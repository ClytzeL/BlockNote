import { createOpenAI } from "@ai-sdk/openai";
import {
  Block,
  BlockNoteEditor,
  BlockSchema,
  InlineContentSchema,
  StyleSchema,
} from "@blocknote/core";
import { CoreMessage, StreamObjectResult, jsonSchema, streamObject } from "ai";
import { AIFunction } from "./functions";
import { addFunction } from "./functions/add";
import { deleteFunction } from "./functions/delete";
import { updateFunction } from "./functions/update";
import { createOperationsArraySchema } from "./schema/operations";
import { blockNoteSchemaToJSONSchema } from "./schema/schemaToJSONSchema";

export function createMessagesForLLM(opts: {
  prompt: string;
  document: any;
}): Array<CoreMessage> {
  return [
    {
      role: "system",
      content: "You're manipulating a text document. This is the document:",
    },
    {
      role: "system",
      content: JSON.stringify(suffixIDs(opts.document)),
    },
    {
      role: "user",
      content: opts.prompt,
    },
  ];
}

export function suffixIDs<
  T extends Block<BlockSchema, InlineContentSchema, StyleSchema>
>(blocks: T[]): T[] {
  return blocks.map((block) => ({
    ...block,
    id: `${block.id}$`,
    children: suffixIDs(block.children),
  }));
}

type CallLLMOptions = {
  functions?: AIFunction[];
} & (
  | {
      prompt: string;
    }
  | {
      messages: Array<CoreMessage>;
    }
);

export async function callLLMStreaming(
  editor: BlockNoteEditor<any, any, any>,
  options: CallLLMOptions & {
    _streamObjectOptions?: Partial<Parameters<typeof streamObject<any>>[0]>;
  }
) {
  const withDefaults: Required<
    Omit<CallLLMOptions, "prompt"> & { messages: CoreMessage[] }
  > = {
    functions: [updateFunction, addFunction, deleteFunction],
    messages:
      (options as any).messages ||
      createMessagesForLLM({
        prompt: (options as any).prompt,
        document: editor.document,
      }),
    ...options,
  };
  // options.streamObjectOptions!.
  const model = createOpenAI({
    apiKey: "",
  })("gpt-4o-2024-08-06", {});

  const ret = await streamObject<any>({
    model,
    mode: "tool",
    schema: jsonSchema({
      ...createOperationsArraySchema(withDefaults.functions),
      $defs: blockNoteSchemaToJSONSchema(editor.schema).$defs as any,
    }),
    messages: withDefaults.messages,
    ...(options._streamObjectOptions as any),
  });
  await applyLLMResponse(editor, ret, withDefaults.functions);
}

export function applyAIOperation(
  operation: any,
  editor: BlockNoteEditor,
  functions: AIFunction[],
  operationContext: any
) {
  const func = functions.find((func) => func.schema.name === operation.type);
  if (!func || !func.validate(operation, editor)) {
    console.log("INVALID OPERATION", operation);
    return operationContext;
  }
  return func.apply(operation, editor, operationContext);
}

export async function applyLLMResponse(
  editor: BlockNoteEditor,
  response: StreamObjectResult<any, any, any>,
  functions: AIFunction[]
) {
  let numOperationsAppliedCompletely = 0;
  let operationContext: any = undefined;

  for await (const partialObject of response.partialObjectStream) {
    const operations: [] = partialObject.operations || [];
    console.log(operations);
    let isFirst = true;
    for (const operation of operations.slice(numOperationsAppliedCompletely)) {
      operationContext = applyAIOperation(
        operation,
        editor,
        functions,
        isFirst ? operationContext : undefined
      );
      isFirst = false;
    }
    numOperationsAppliedCompletely = operations.length - 1;
  }
}

// - cursor position
// - API design (customize context, cursor position, prompt, stream / nostream, validation)