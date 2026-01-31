import { Mem0Memory } from "../memory/mem0";
import { getUserTool } from "../db/queries";
import * as vm from "vm";
import OpenAI from "openai";

export interface StepExecutionContext {
  workflowInput: unknown;
  stepOutputs: Record<string, unknown>;
  userId: string;
  env?: Record<string, string>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: "tool" | "inline" | "memory" | "llm" | "inference";
  description?: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
  toolId?: string;
  code?: string;
  operation?: "search" | "add" | "update" | "delete" | "get" | "getAll" | "deleteAll";
  queryExpression?: string;
  memoryIdExpression?: string; // Expression to get memory ID for update/delete/get operations
  inputMapping?: string;
  // LLM step fields
  model?: string; // e.g., "gpt-4o", "gpt-4o-mini"
  systemPrompt?: string; // System prompt for the LLM
  userPromptExpression?: string; // Expression to build the user prompt from input/context
  temperature?: number; // 0-2, default 0.7
  maxTokens?: number; // Max tokens for response
  // Inference step fields (deterministic inference, host/port via system env vars)
  promptExpression?: string; // Expression to build the prompt
  topP?: number; // Top-p sampling (0-1)
  topK?: number; // Top-k sampling (0 = disabled)
  seed?: number; // Random seed for reproducibility
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
      case "llm":
        result = await executeLlmStep(stepDef, input, context);
        break;
      case "inference":
        result = await executeInferenceStep(stepDef, input, context);
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

async function executeLlmStep(
  stepDef: WorkflowStep,
  input: unknown,
  context: StepExecutionContext
): Promise<unknown> {
  const openai = new OpenAI();

  // Build context for expression evaluation
  const contextForEval = {
    workflowInput: context.workflowInput,
    stepOutputs: context.stepOutputs,
    input,
  };

  // Helper to evaluate expressions
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

  // Get user prompt from expression or use default
  let userPrompt: string;
  if (stepDef.userPromptExpression) {
    const evaluated = evalExpression(stepDef.userPromptExpression);
    userPrompt = typeof evaluated === "string" ? evaluated : JSON.stringify(evaluated, null, 2);
  } else {
    // Default: stringify the input
    userPrompt = typeof input === "string" ? input : JSON.stringify(input, null, 2);
  }

  const model = stepDef.model || "gpt-4o-mini";
  const systemPrompt = stepDef.systemPrompt || "You are a helpful assistant.";
  const temperature = stepDef.temperature ?? 0.7;
  const maxTokens = stepDef.maxTokens || 1000;

  console.log(`[LLM Step] Model: ${model}, User prompt: ${userPrompt.substring(0, 100)}...`);

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content || "";
    const usage = response.usage;

    console.log(`[LLM Step] Response received, tokens used: ${usage?.total_tokens}`);

    return {
      response: content,
      model,
      usage: {
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
      },
    };
  } catch (error) {
    console.error("[LLM Step] Error:", error);
    throw new Error(
      `LLM call failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function executeInferenceStep(
  stepDef: WorkflowStep,
  input: unknown,
  context: StepExecutionContext
): Promise<unknown> {
  // Build context for expression evaluation
  const contextForEval = {
    workflowInput: context.workflowInput,
    stepOutputs: context.stepOutputs,
    input,
  };

  // Helper to evaluate expressions
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

  // Get host and port from system environment variables (internal)
  const host = process.env.INFERENCE_HOST || "localhost";
  const port = process.env.INFERENCE_PORT || "8000";

  // Get prompt from expression or use default
  let prompt: string;
  if (stepDef.promptExpression) {
    const evaluated = evalExpression(stepDef.promptExpression);
    prompt = typeof evaluated === "string" ? evaluated : JSON.stringify(evaluated, null, 2);
  } else {
    prompt = typeof input === "string" ? input : JSON.stringify(input, null, 2);
  }

  // Sampling parameters
  const temperature = stepDef.temperature ?? 0.0; // Default to 0 for deterministic
  const topP = stepDef.topP ?? 1.0;
  const topK = stepDef.topK ?? 0;
  const seed = stepDef.seed ?? 42;

  // Construct URL
  const baseUrl =
    host.startsWith("http://") || host.startsWith("https://")
      ? `${host}:${port}`
      : `http://${host}:${port}`;
  const url = `${baseUrl}/generate`;

  console.log(`[Inference Step] URL: ${url}, Prompt: ${prompt.substring(0, 100)}...`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompts: [prompt],
        temperature,
        top_p: topP,
        top_k: topK,
        seed,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.outputs || !Array.isArray(data.outputs) || data.outputs.length === 0) {
      throw new Error("Invalid response format: missing outputs");
    }

    const output = data.outputs[0];

    console.log(`[Inference Step] Response received: ${output.substring(0, 100)}...`);

    return {
      output,
      prompt,
      parameters: {
        temperature,
        topP,
        topK,
        seed,
      },
      endpoint: url,
    };
  } catch (error) {
    console.error("[Inference Step] Error:", error);
    throw new Error(
      `Inference call failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
