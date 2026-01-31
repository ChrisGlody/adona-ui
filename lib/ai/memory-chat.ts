import { openai } from "@ai-sdk/openai";
import type { ModelMessage } from "ai";
import { streamText } from "ai";
import { z } from "zod";
import type { Mem0Memory } from "@/lib/memory/mem0";
import { runRegisteredTool } from "@/lib/ai/run-tool";

type RegisteredTool = {
  id: string;
  name: string;
  description: string | null;
  inputSchema: unknown;
  outputSchema: unknown;
  type: string;
  lambdaArn?: string | null;
  implementation?: string | null;
};

function toZod(schema: unknown): z.ZodTypeAny {
  const anyObject = z.object({}).catchall(z.any());
  const convert = (s: unknown): z.ZodTypeAny => {
    if (!s || typeof s !== "object") return anyObject;
    const obj = s as { type?: string; properties?: Record<string, unknown>; required?: string[]; items?: unknown };
    switch (obj.type) {
      case "object": {
        const props = obj.properties ?? {};
        const required: string[] = Array.isArray(obj.required) ? obj.required : [];
        const shape: Record<string, z.ZodTypeAny> = {};
        for (const [key, propSchema] of Object.entries(props)) {
          let prop = convert(propSchema);
          if (!required.includes(key)) prop = prop.optional();
          shape[key] = prop;
        }
        return z.object(shape).catchall(z.any());
      }
      case "string":
        return z.string();
      case "number":
        return z.number();
      case "integer":
        return z.number().int();
      case "boolean":
        return z.boolean();
      case "array":
        return z.array(convert(obj.items ?? {}));
      default:
        return anyObject;
    }
  };
  const zschema = convert(schema);
  if (zschema._def?.typeName === "ZodObject") return zschema;
  return z.object({ input: zschema }).catchall(z.any());
}

export async function chat(
  messages: ModelMessage[],
  userId: string,
  memory: Mem0Memory,
  updateStatus?: (status: string) => void,
  tools?: RegisteredTool[]
) {
  const memoryContext = "  (No saved facts found)";
  const system = `You are a helpful AI chat assistant.

Current date: ${new Date().toISOString().split("T")[0]}
User ID: ${userId}`;

  const toolTools = (tools ?? []).reduce<
    Record<string, { description: string; inputSchema: z.ZodTypeAny; execute: (args: unknown) => Promise<unknown> }>
  >((acc, t) => {
    const key = `${t.name}_${t.id}`.replace(/\s+/g, "_");
    acc[key] = {
      description: (t.description as string) ?? "User-registered tool",
      inputSchema: toZod(t.inputSchema),
      execute: async (args: unknown) => {
        updateStatus?.("Running tool...");
        const out = await runRegisteredTool(userId, t.id, args);
        return out.result;
      },
    };
    return acc;
  }, {});

  const response = streamText({
    model: openai("gpt-4o"),
    system,
    messages,
    tools: toolTools,
    toolChoice: "auto",
  });

  return response;
}
