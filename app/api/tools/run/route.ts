import { NextResponse } from "next/server";
import { getUserTool } from "@/lib/db/queries";
import { getAuthUser } from "@/lib/auth.server";
import { VM } from "vm2";

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

  if (tool.type === "s3-inline" && tool.implementation) {
    try {
      const vm = new VM({ timeout: 10000 });
      const code = (tool.implementation as string).replace(/^export\s+/, "");
      const script = `${code}; return typeof main === 'function' ? main : (typeof module !== 'undefined' && module.exports && module.exports.main) ? module.exports.main : null;`;
      const main = vm.run(script);
      if (typeof main !== "function") {
        return NextResponse.json({ error: "Tool must export async function main(input)" }, { status: 500 });
      }
      const result = await main(input);
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
