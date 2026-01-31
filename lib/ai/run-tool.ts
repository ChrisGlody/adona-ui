import { getUserTool } from "@/lib/db/queries";
import * as vm from "vm";

export async function runRegisteredTool(
  userId: string,
  toolId: string,
  input: unknown
): Promise<{ result: unknown }> {
  const results = await getUserTool(toolId, userId);
  const tool = results[0];
  if (!tool) throw new Error("Tool not found");

  if (tool.type === "lambda" && tool.lambdaArn) {
    throw new Error("Lambda tools not supported in this environment");
  }

  if (tool.type === "s3-inline" && tool.implementation) {
    const code = (tool.implementation as string).replace(/^export\s+(async\s+)?function\s+main/, "$1function main");

    const sandbox = {
      console: { log: console.log, error: console.error, warn: console.warn },
      JSON,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Promise,
      setTimeout,
      clearTimeout,
      fetch,
      __input: input,
      __result: undefined as unknown,
    };

    const wrappedCode = `
      ${code}
      if (typeof main === 'function') {
        __result = main(__input);
      } else {
        throw new Error('Tool must export async function main(input)');
      }
    `;

    const vmContext = vm.createContext(sandbox);
    const script = new vm.Script(wrappedCode);
    script.runInContext(vmContext, { timeout: 10000 });

    const result = await Promise.resolve(sandbox.__result);
    return { result };
  }

  if (tool.type === "http" && tool.implementation) {
    const res = await fetch(tool.implementation, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const result = await res.json();
    return { result };
  }

  throw new Error("Unsupported tool type");
}
