import { Mem0Memory } from "../memory/mem0";
import { getUserTool } from "../db/queries";
import { VM } from "vm2";

export interface StepExecutionContext {
  workflowInput: unknown;
  stepOutputs: Record<string, unknown>;
  userId: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: "tool" | "inline" | "http" | "memory";
  description?: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
  toolId?: string;
  code?: string;
  url?: string;
  operation?: "search" | "add";
  queryExpression?: string;
  inputMapping?: string;
}

export async function executeStep(
  stepDef: WorkflowStep,
  input: unknown,
  context: StepExecutionContext
): Promise<unknown> {
  const { userId } = context;

  try {
    let result: unknown;
    switch (stepDef.type) {
      case "tool":
        result = await executeToolStep(stepDef, input, userId);
        break;
      case "inline":
        result = await executeInlineStep(stepDef, input, context);
        break;
      case "http":
        result = await executeHttpStep(stepDef, input);
        break;
      case "memory":
        result = await executeMemoryStep(stepDef, input, context);
        break;
      default:
        throw new Error(`Unsupported step type: ${stepDef.type}`);
    }
    return result;
  } catch (error: unknown) {
    console.error(`Step execution failed for ${stepDef.id}:`, error);
    throw new Error(
      `Step execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function executeToolStep(
  stepDef: WorkflowStep,
  input: unknown,
  userId: string
): Promise<unknown> {
  if (!stepDef.toolId) throw new Error("Tool step missing toolId");
  const results = await getUserTool(stepDef.toolId, userId);
  const tool = results[0];
  if (!tool) throw new Error(`Tool not found: ${stepDef.toolId}`);

  if (tool.type === "s3-inline" && tool.implementation) {
    return executeInlineCode(tool.implementation as string, input, {
      workflowInput: input,
      stepOutputs: {},
      userId,
    });
  }
  if (tool.type === "http" && tool.implementation) {
    const res = await fetch(tool.implementation, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.json();
  }
  if (tool.type === "lambda" && tool.lambdaArn) {
    throw new Error("Lambda tools not supported in this environment");
  }
  throw new Error(`Unsupported tool type: ${tool.type}`);
}

async function executeInlineStep(
  stepDef: WorkflowStep,
  input: unknown,
  context: StepExecutionContext
): Promise<unknown> {
  if (!stepDef.code) throw new Error("Inline step missing code");
  return executeInlineCode(stepDef.code, input, context);
}

function executeInlineCode(
  code: string,
  input: unknown,
  context: StepExecutionContext
): Promise<unknown> {
  const normalized = code.replace(/^export\s+(async\s+)?function\s+main/, "$1function main");
  const script = `${normalized}; return typeof main === 'function' ? main : (typeof module !== 'undefined' && module.exports && module.exports.main) ? module.exports.main : null;`;
  const vm = new VM({ timeout: 10000 });
  const main = vm.run(script);
  if (typeof main !== "function") throw new Error("No main function found in inline code");
  return main(input, context);
}

async function executeHttpStep(stepDef: WorkflowStep, input: unknown): Promise<unknown> {
  if (!stepDef.url) throw new Error("HTTP step missing URL");
  const res = await fetch(stepDef.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

async function executeMemoryStep(
  stepDef: WorkflowStep,
  input: unknown,
  context: StepExecutionContext
): Promise<unknown> {
  if (!stepDef.operation || !stepDef.queryExpression)
    throw new Error("Memory step missing operation or queryExpression");
  const memory = new Mem0Memory();
  const { userId } = context;
  const contextForEval = {
    workflowInput: context.workflowInput,
    stepOutputs: context.stepOutputs,
    input,
  };
  const fn = new Function("context", `return (${stepDef.queryExpression});`);
  const query = fn(contextForEval);
  if (stepDef.operation === "search") {
    const results = await memory.search(query, { userId });
    return { operation: "search", query, results };
  }
  if (stepDef.operation === "add") {
    await memory.add([{ role: "user", content: query }], { userId });
    return { operation: "add", content: query, success: true };
  }
  throw new Error(`Unsupported memory operation: ${stepDef.operation}`);
}
