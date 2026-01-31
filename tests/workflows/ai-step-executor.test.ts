import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeStep,
  type WorkflowStep,
  type StepExecutionContext,
} from "@/lib/workflows/ai-step-executor";

// Mock dependencies
vi.mock("@/lib/db/queries", () => ({
  getUserTool: vi.fn(),
}));

vi.mock("@/lib/memory/mem0", () => ({
  Mem0Memory: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue([{ content: "memory result" }]),
    add: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { getUserTool } from "@/lib/db/queries";

describe("ai-step-executor", () => {
  const baseContext: StepExecutionContext = {
    workflowInput: { test: "input" },
    stepOutputs: {},
    userId: "user-123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("executeStep", () => {
    describe("inline steps", () => {
      // Note: VM2 executes code in a sandbox where the script is wrapped.
      // The code format must match what executeInlineCode expects.
      it("should execute inline code and return result", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "Inline Step",
          type: "inline",
          code: "function main(input, context) { return { doubled: input.value * 2 }; }",
        };

        const result = await executeStep(step, { value: 5 }, baseContext);

        expect(result).toEqual({ doubled: 10 });
      });

      it("should execute async inline code", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "Async Inline Step",
          type: "inline",
          code: "async function main(input, context) { return { message: 'async result' }; }",
        };

        const result = await executeStep(step, {}, baseContext);

        expect(result).toEqual({ message: "async result" });
      });

      it("should handle export function main syntax", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "Export Inline Step",
          type: "inline",
          code: "export function main(input, context) { return { exported: true }; }",
        };

        const result = await executeStep(step, {}, baseContext);

        expect(result).toEqual({ exported: true });
      });

      it("should handle export async function main syntax", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "Export Async Inline Step",
          type: "inline",
          code: "export async function main(input, context) { return { exportedAsync: true }; }",
        };

        const result = await executeStep(step, {}, baseContext);

        expect(result).toEqual({ exportedAsync: true });
      });

      it("should provide context to inline code", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "Context Step",
          type: "inline",
          code: "function main(input, context) { return { userId: context.userId, workflowInput: context.workflowInput, stepOutputs: context.stepOutputs }; }",
        };
        const context: StepExecutionContext = {
          workflowInput: { original: "data" },
          stepOutputs: { prev: { result: 42 } },
          userId: "test-user",
        };

        const result = await executeStep(step, {}, context);

        expect(result).toEqual({
          userId: "test-user",
          workflowInput: { original: "data" },
          stepOutputs: { prev: { result: 42 } },
        });
      });

      it("should throw error for inline step without code", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "No Code Step",
          type: "inline",
        };

        await expect(executeStep(step, {}, baseContext)).rejects.toThrow(
          "Inline step missing code"
        );
      });

      it("should throw error for inline code without main function", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "No Main Step",
          type: "inline",
          code: "function helper() { return 1; }",
        };

        await expect(executeStep(step, {}, baseContext)).rejects.toThrow(
          "No main function found in inline code"
        );
      });

      it("should handle code that throws an error", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "Error Step",
          type: "inline",
          code: "function main(input, context) { throw new Error('Intentional error'); }",
        };

        await expect(executeStep(step, {}, baseContext)).rejects.toThrow(
          "Intentional error"
        );
      });
    });

    describe("tool steps", () => {
      it("should execute s3-inline tool", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "Tool Step",
          type: "tool",
          toolId: "tool-123",
        };
        vi.mocked(getUserTool).mockResolvedValueOnce([
          {
            id: "tool-123",
            name: "Test Tool",
            type: "s3-inline",
            implementation: "function main(input, context) { return { toolResult: input.value + 1 }; }",
            owner: "user-123",
            description: null,
            inputSchema: null,
            outputSchema: null,
            lambdaArn: null,
            createdAt: new Date(),
          },
        ]);

        const result = await executeStep(step, { value: 10 }, baseContext);

        expect(getUserTool).toHaveBeenCalledWith("tool-123", "user-123");
        expect(result).toEqual({ toolResult: 11 });
      });

      it("should execute http tool", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "HTTP Tool Step",
          type: "tool",
          toolId: "http-tool",
        };
        vi.mocked(getUserTool).mockResolvedValueOnce([
          {
            id: "http-tool",
            name: "HTTP Tool",
            type: "http",
            implementation: "https://api.example.com/tool",
            owner: "user-123",
            description: null,
            inputSchema: null,
            outputSchema: null,
            lambdaArn: null,
            createdAt: new Date(),
          },
        ]);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ httpToolResult: true }),
        });

        const result = await executeStep(step, { query: "test" }, baseContext);

        expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/tool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "test" }),
        });
        expect(result).toEqual({ httpToolResult: true });
      });

      it("should throw error for tool step without toolId", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "No ToolId Step",
          type: "tool",
        };

        await expect(executeStep(step, {}, baseContext)).rejects.toThrow(
          "Tool step missing toolId"
        );
      });

      it("should throw error when tool is not found", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "Unknown Tool Step",
          type: "tool",
          toolId: "non-existent",
        };
        vi.mocked(getUserTool).mockResolvedValueOnce([]);

        await expect(executeStep(step, {}, baseContext)).rejects.toThrow(
          "Tool not found: non-existent"
        );
      });

      it("should throw error for lambda tool type", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "Lambda Tool Step",
          type: "tool",
          toolId: "lambda-tool",
        };
        vi.mocked(getUserTool).mockResolvedValueOnce([
          {
            id: "lambda-tool",
            name: "Lambda Tool",
            type: "lambda",
            lambdaArn: "arn:aws:lambda:us-east-1:123456789:function:test",
            implementation: null,
            owner: "user-123",
            description: null,
            inputSchema: null,
            outputSchema: null,
            createdAt: new Date(),
          },
        ]);

        await expect(executeStep(step, {}, baseContext)).rejects.toThrow(
          "Lambda tools not supported in this environment"
        );
      });

      it("should throw error for unsupported tool type", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "Unknown Type Tool Step",
          type: "tool",
          toolId: "weird-tool",
        };
        vi.mocked(getUserTool).mockResolvedValueOnce([
          {
            id: "weird-tool",
            name: "Weird Tool",
            type: "unknown-type" as "http",
            implementation: null,
            owner: "user-123",
            description: null,
            inputSchema: null,
            outputSchema: null,
            lambdaArn: null,
            createdAt: new Date(),
          },
        ]);

        await expect(executeStep(step, {}, baseContext)).rejects.toThrow(
          "Unsupported tool type"
        );
      });
    });

    describe("memory steps", () => {
      it("should execute search operation", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "Memory Search Step",
          type: "memory",
          operation: "search",
          queryExpression: "context.input.query",
        };

        const result = await executeStep(
          step,
          { query: "find documents" },
          baseContext
        );

        expect(result).toEqual({
          operation: "search",
          query: "find documents",
          results: [{ content: "memory result" }],
        });
      });

      it("should execute add operation", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "Memory Add Step",
          type: "memory",
          operation: "add",
          queryExpression: "context.input.content",
        };

        const result = await executeStep(
          step,
          { content: "new memory" },
          baseContext
        );

        expect(result).toEqual({
          operation: "add",
          content: "new memory",
          success: true,
        });
      });

      it("should throw error for memory step without operation", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "No Op Memory Step",
          type: "memory",
          queryExpression: "context.input.query",
        };

        await expect(executeStep(step, {}, baseContext)).rejects.toThrow(
          "Memory step missing operation or queryExpression"
        );
      });

      it("should throw error for memory step without queryExpression", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "No Query Memory Step",
          type: "memory",
          operation: "search",
        };

        await expect(executeStep(step, {}, baseContext)).rejects.toThrow(
          "Memory step missing operation or queryExpression"
        );
      });

      it("should use stepOutputs in query expression", async () => {
        const step: WorkflowStep = {
          id: "step1",
          name: "Complex Query Step",
          type: "memory",
          operation: "search",
          queryExpression: "context.stepOutputs.prev.searchTerm",
        };
        const context: StepExecutionContext = {
          ...baseContext,
          stepOutputs: { prev: { searchTerm: "from previous step" } },
        };

        const result = await executeStep(step, {}, context);

        expect(result).toEqual({
          operation: "search",
          query: "from previous step",
          results: [{ content: "memory result" }],
        });
      });
    });

    describe("unsupported step types", () => {
      it("should throw error for unsupported step type", async () => {
        const step = {
          id: "step1",
          name: "Unknown Step",
          type: "unknown" as "inline",
        };

        await expect(executeStep(step, {}, baseContext)).rejects.toThrow(
          "Unsupported step type: unknown"
        );
      });
    });

    describe("error handling", () => {
      it("should wrap errors with step context", async () => {
        const step: WorkflowStep = {
          id: "failing-step",
          name: "Failing Step",
          type: "inline",
          code: "function main() { throw new Error('Original error'); }",
        };

        await expect(executeStep(step, {}, baseContext)).rejects.toThrow(
          "Original error"
        );
      });
    });
  });
});
