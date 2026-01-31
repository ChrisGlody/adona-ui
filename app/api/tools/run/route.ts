import { NextResponse } from "next/server";
import { getUserTool } from "@/lib/db/queries";
import { getAuthUser } from "@/lib/auth.server";
import * as vm from "vm";

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toolId, input } = await req.json();
  const results = await getUserTool(toolId, user.sub);
  const tool = results[0];

  if (!tool) return NextResponse.json({ error: "Tool not found" }, { status: 404 });

  if (tool.type === "lambda" && tool.lambdaArn) {
    return NextResponse.json(
      { error: "Lambda tools not supported in this environment" },
      { status: 501 }
    );
  }

  if ((tool.type === "s3-inline" || tool.type === "db") && tool.implementation) {
    try {
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
      return NextResponse.json({ result });
    } catch (e) {
      console.error("Tool run error:", e);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Tool execution failed" },
        { status: 500 }
      );
    }
  }

  if (tool.type === "http" && tool.implementation) {
    const res = await fetch(tool.implementation, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const result = await res.json();
    return NextResponse.json({ result });
  }

  return NextResponse.json({ error: "Unsupported tool type" }, { status: 400 });
}
