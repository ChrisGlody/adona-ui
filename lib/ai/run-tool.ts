import { getUserTool } from "@/lib/db/queries";
import { VM } from "vm2";

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
    const code = (tool.implementation as string).replace(/^export\s+/, "");
    const script = `${code}; return typeof main === 'function' ? main : null;`;
    const vm = new VM({ timeout: 10000 });
    const main = vm.run(script);
    if (typeof main !== "function") {
      throw new Error("Tool must export async function main(input)");
    }
    const result = await main(input);
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
