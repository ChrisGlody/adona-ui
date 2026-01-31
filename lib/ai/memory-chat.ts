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
  // Extract the last user message for memory search
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const rawContent = lastUser?.content;
  const searchQuery =
    typeof rawContent === "string"
      ? rawContent
      : rawContent
        ? JSON.stringify(rawContent)
        : "";

  // Search memory for relevant context
  let memories: { id: string; content: string | undefined }[] = [];
  if (searchQuery) {
    try {
      updateStatus?.("Searching memory...");
      const result = await memory.search(searchQuery, { userId });
      memories = (result || []).map((m) => ({ id: m.id, content: m.content }));
    } catch (error) {
      console.error("Memory search failed:", error);
    }
  }

  const memoryContext =
    memories.length > 0
      ? memories.map((m, index) => `  ${index + 1}. ${m.content}`).join("\n")
      : "  (No saved facts found)";

  const system = `You are a helpful AI chat assistant with long-term memory.

IMPORTANT: You have access to the user's personal memory data below. Use this information to personalize responses and avoid repeating questions.

MEMORY DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Saved User Facts:
${memoryContext}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Guidelines:
- Reference memory facts naturally when relevant
- Do not invent facts not present in memory
- If unsure, ask for clarification
- Keep responses concise and helpful

MEMORY HIGHLIGHTING:
- Wrap memory-derived info with <memory>...</memory> tags when directly referenced.

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

  // Update memory with the conversation (fire and forget)
  if (searchQuery) {
    (async () => {
      try {
        updateStatus?.("Updating memory...");
        await memory.add([{ role: "user", content: searchQuery }], { userId });
      } catch (error) {
        console.error("Memory update failed:", error);
      }
    })();
  }

  return response;
}
