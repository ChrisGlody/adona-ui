import { Mem0Memory } from "../memory/mem0";
import { getUserTool } from "../db/queries";
import * as vm from "vm";

export interface StepExecutionContext {
  workflowInput: unknown;
  stepOutputs: Record<string, unknown>;
  userId: string;
  env?: Record<string, string>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: "tool" | "inline" | "memory";
  description?: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
  toolId?: string;
  code?: string;
  operation?: "search" | "add" | "update" | "delete" | "get" | "getAll" | "deleteAll";
  queryExpression?: string;
  memoryIdExpression?: string; // Expression to get memory ID for update/delete/get operations
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
  // Normalize export syntax to plain function
  const normalized = code.replace(/^export\s+(async\s+)?function\s+main/, "$1function main");

  // Create a sandbox context with necessary globals
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
    fetch, // Allow fetch in inline code
    __input: input,
    __context: {
      ...context,
      env: context.env ?? {}, // Ensure env is always an object
    },
    __result: undefined as unknown,
  };

  // Wrap the code to capture the main function and execute it
  const wrappedCode = `
    ${normalized}
    if (typeof main === 'function') {
      __result = main(__input, __context);
    } else {
      throw new Error('No main function found in inline code');
    }
  `;

  const vmContext = vm.createContext(sandbox);
  const script = new vm.Script(wrappedCode);
  script.runInContext(vmContext, { timeout: 10000 });

  return Promise.resolve(sandbox.__result);
}

async function executeMemoryStep(
  stepDef: WorkflowStep,
  input: unknown,
  context: StepExecutionContext
): Promise<unknown> {
  if (!stepDef.operation)
    throw new Error("Memory step missing operation");

  const memory = new Mem0Memory();
  const { userId } = context;
  const contextForEval = {
    workflowInput: context.workflowInput,
    stepOutputs: context.stepOutputs,
    input,
  };

  // Helper to evaluate expressions
  // Supports: input, workflowInput, stepOutputs, and context (which contains all three)
  const evalExpression = (expr: string | undefined) => {
    if (!expr) return undefined;
    const fn = new Function(
      "input",
      "workflowInput",
      "stepOutputs",
      "context",
      `return (${expr});`
    );
    return fn(
      contextForEval.input,
      contextForEval.workflowInput,
      contextForEval.stepOutputs,
      contextForEval
    );
  };

  switch (stepDef.operation) {
    case "search": {
      if (!stepDef.queryExpression)
        throw new Error("Memory search operation missing queryExpression");
      const query = evalExpression(stepDef.queryExpression);
      const results = await memory.search(query, { userId });
      return { operation: "search", query, results };
    }

    case "add": {
      if (!stepDef.queryExpression)
        throw new Error("Memory add operation missing queryExpression");
      const content = evalExpression(stepDef.queryExpression);
      await memory.add([{ role: "user", content }], { userId });
      return { operation: "add", content, success: true };
    }

    case "update": {
      if (!stepDef.memoryIdExpression)
        throw new Error("Memory update operation missing memoryIdExpression");
      if (!stepDef.queryExpression)
        throw new Error("Memory update operation missing queryExpression (new content)");
      const memoryId = evalExpression(stepDef.memoryIdExpression);
      const newContent = evalExpression(stepDef.queryExpression);
      await memory.update(memoryId, newContent);
      return { operation: "update", memoryId, content: newContent, success: true };
    }

    case "delete": {
      if (!stepDef.memoryIdExpression)
        throw new Error("Memory delete operation missing memoryIdExpression");
      const memoryId = evalExpression(stepDef.memoryIdExpression);
      await memory.delete(memoryId);
      return { operation: "delete", memoryId, success: true };
    }

    case "get": {
      if (!stepDef.memoryIdExpression)
        throw new Error("Memory get operation missing memoryIdExpression");
      const memoryId = evalExpression(stepDef.memoryIdExpression);
      const result = await memory.get(memoryId);
      return { operation: "get", memoryId, result };
    }

    case "getAll": {
      const results = await memory.getAll({ userId });
      return { operation: "getAll", results };
    }

    case "deleteAll": {
      await memory.deleteAll({ userId });
      return { operation: "deleteAll", success: true };
    }

    default:
      throw new Error(`Unsupported memory operation: ${stepDef.operation}`);
  }
}
