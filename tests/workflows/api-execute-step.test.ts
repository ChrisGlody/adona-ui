import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/workflows/[runId]/step/[stepId]/execute/route";

// Mock dependencies
vi.mock("@/lib/auth.server", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/db/queries", () => ({
  getWorkflowWithSteps: vi.fn(),
  getRunStatus: vi.fn(),
  createOrUpdateStepExecution: vi.fn(),
  updateRunStatus: vi.fn(),
}));

vi.mock("@/lib/workflows/graph-analyzer", () => ({
  getNextExecutableSteps: vi.fn(),
  isWorkflowComplete: vi.fn(),
}));

vi.mock("@/lib/workflows/ai-step-executor", () => ({
  executeStep: vi.fn(),
}));

import { getAuthUser } from "@/lib/auth.server";
import {
  getWorkflowWithSteps,
  getRunStatus,
  createOrUpdateStepExecution,
  updateRunStatus,
} from "@/lib/db/queries";
import {
  getNextExecutableSteps,
  isWorkflowComplete,
} from "@/lib/workflows/graph-analyzer";
import { executeStep } from "@/lib/workflows/ai-step-executor";

describe("POST /api/ai/workflows/[runId]/step/[stepId]/execute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: unknown) => {
    return new Request(
      "http://localhost/api/ai/workflows/run-123/step/step-1/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
  };

  const mockParams = Promise.resolve({ runId: "run-123", stepId: "step-1" });

  const mockWorkflow = {
    id: "workflow-123",
    owner: "user-123",
    name: "Test Workflow",
    definition: {
      nodes: [
        { id: "step-1", name: "First Step", type: "inline", code: "fn main(){}" },
        { id: "step-2", name: "Second Step", type: "http", url: "https://example.com" },
      ],
      edges: [{ id: "e1", source: "step-1", target: "step-2" }],
    },
    executionEnv: "db",
    inputSchema: null,
    outputSchema: null,
    definitionVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRun = {
    id: "run-123",
    workflowId: "workflow-123",
    owner: "user-123",
    status: "running",
    input: { testInput: "value" },
    output: null,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: new Date(),
    endedAt: null,
  };

  describe("authentication", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getAuthUser).mockResolvedValueOnce(null);

      const response = await POST(createRequest({}), { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("validation", () => {
    beforeEach(() => {
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" });
    });

    it("should return 404 if workflow run does not exist", async () => {
      vi.mocked(getRunStatus).mockResolvedValueOnce(null);

      const response = await POST(createRequest({}), { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Workflow run not found");
    });

    it("should return 404 if workflow does not exist", async () => {
      vi.mocked(getRunStatus).mockResolvedValueOnce({
        run: mockRun,
        steps: [],
      });
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce(null);

      const response = await POST(createRequest({}), { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Workflow not found");
    });

    it("should return 404 if step is not in workflow definition", async () => {
      vi.mocked(getRunStatus).mockResolvedValueOnce({
        run: mockRun,
        steps: [],
      });
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce({
        ...mockWorkflow,
        definition: { nodes: [], edges: [] },
      });

      const response = await POST(createRequest({}), { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Step not found in workflow definition");
    });

    it("should return 400 if step is already completed", async () => {
      vi.mocked(getRunStatus).mockResolvedValueOnce({
        run: mockRun,
        steps: [{ stepId: "step-1", status: "completed", output: {} }],
      });
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce(mockWorkflow);

      const response = await POST(createRequest({}), { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Step already completed");
    });
  });

  describe("successful step execution", () => {
    beforeEach(() => {
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" });
      vi.mocked(getRunStatus)
        .mockResolvedValueOnce({ run: mockRun, steps: [] })
        .mockResolvedValueOnce({
          run: mockRun,
          steps: [{ stepId: "step-1", status: "completed", output: { result: 42 } }],
        });
      vi.mocked(getWorkflowWithSteps).mockResolvedValue(mockWorkflow);
      vi.mocked(createOrUpdateStepExecution).mockResolvedValue(undefined);
    });

    it("should execute step and return output with next steps", async () => {
      vi.mocked(executeStep).mockResolvedValueOnce({ result: 42 });
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([
        { stepId: "step-2", name: "Second Step", type: "http" },
      ]);
      vi.mocked(isWorkflowComplete).mockReturnValueOnce(false);

      const response = await POST(
        createRequest({ input: { data: "test" } }),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.output).toEqual({ result: 42 });
      expect(data.nextSteps).toHaveLength(1);
      expect(data.nextSteps[0].stepId).toBe("step-2");
      expect(data.isComplete).toBe(false);
      expect(data.message).toBe("Step executed successfully");
    });

    it("should mark step as running before execution", async () => {
      vi.mocked(executeStep).mockResolvedValueOnce({});
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([]);
      vi.mocked(isWorkflowComplete).mockReturnValueOnce(true);

      await POST(createRequest({}), { params: mockParams });

      expect(createOrUpdateStepExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: "run-123",
          stepId: "step-1",
          status: "running",
        })
      );
    });

    it("should mark step as completed after successful execution", async () => {
      vi.mocked(executeStep).mockResolvedValueOnce({ success: true });
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([]);
      vi.mocked(isWorkflowComplete).mockReturnValueOnce(true);

      await POST(createRequest({}), { params: mockParams });

      expect(createOrUpdateStepExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: "run-123",
          stepId: "step-1",
          status: "completed",
          output: { success: true },
        })
      );
    });

    it("should mark workflow as completed when all steps are done", async () => {
      vi.mocked(executeStep).mockResolvedValueOnce({ final: true });
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([]);
      vi.mocked(isWorkflowComplete).mockReturnValueOnce(true);

      const response = await POST(createRequest({}), { params: mockParams });
      const data = await response.json();

      expect(data.isComplete).toBe(true);
      expect(updateRunStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "run-123",
          status: "completed",
        })
      );
    });

    it("should not mark workflow as completed if more steps remain", async () => {
      vi.mocked(executeStep).mockResolvedValueOnce({});
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([
        { stepId: "step-2", name: "Step 2", type: "http" },
      ]);
      vi.mocked(isWorkflowComplete).mockReturnValueOnce(false);

      await POST(createRequest({}), { params: mockParams });

      expect(updateRunStatus).not.toHaveBeenCalled();
    });

    it("should pass correct context to executeStep", async () => {
      vi.mocked(executeStep).mockResolvedValueOnce({});
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([]);
      vi.mocked(isWorkflowComplete).mockReturnValueOnce(true);

      await POST(createRequest({ input: { stepInput: "data" } }), {
        params: mockParams,
      });

      // Verify executeStep was called with correct arguments
      expect(executeStep).toHaveBeenCalledTimes(1);
      const [stepDef, input, context] = vi.mocked(executeStep).mock.calls[0];
      expect(stepDef.id).toBe("step-1");
      expect(input).toEqual({ stepInput: "data" });
      expect(context.workflowInput).toEqual({ testInput: "value" });
      expect(context.userId).toBe("user-123");
    });

    it("should include previous step outputs in context", async () => {
      vi.mocked(getRunStatus)
        .mockReset()
        .mockResolvedValueOnce({
          run: mockRun,
          steps: [
            { stepId: "prev-step", status: "completed", output: { prevResult: 100 } },
          ],
        })
        .mockResolvedValueOnce({
          run: mockRun,
          steps: [
            { stepId: "prev-step", status: "completed", output: { prevResult: 100 } },
            { stepId: "step-1", status: "completed", output: { result: 42 } },
          ],
        });
      vi.mocked(executeStep).mockResolvedValueOnce({});
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([]);
      vi.mocked(isWorkflowComplete).mockReturnValueOnce(true);

      await POST(createRequest({}), { params: mockParams });

      // Verify previous step outputs are included
      expect(executeStep).toHaveBeenCalledTimes(1);
      const [, , context] = vi.mocked(executeStep).mock.calls[0];
      expect(context.stepOutputs["prev-step"]).toEqual({ prevResult: 100 });
    });

    it("should handle empty input", async () => {
      vi.mocked(executeStep).mockResolvedValueOnce({});
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([]);
      vi.mocked(isWorkflowComplete).mockReturnValueOnce(true);

      await POST(createRequest({}), { params: mockParams });

      expect(executeStep).toHaveBeenCalledWith(
        expect.anything(),
        {},
        expect.anything()
      );
    });
  });

  describe("step execution failure", () => {
    beforeEach(() => {
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" });
      vi.mocked(getRunStatus).mockResolvedValue({ run: mockRun, steps: [] });
      vi.mocked(getWorkflowWithSteps).mockResolvedValue(mockWorkflow);
      vi.mocked(createOrUpdateStepExecution).mockResolvedValue(undefined);
    });

    it("should mark step as failed and return error", async () => {
      vi.mocked(executeStep).mockRejectedValueOnce(
        new Error("Step execution error")
      );

      const response = await POST(createRequest({}), { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Step execution failed: Step execution error");
    });

    it("should record error in step execution record", async () => {
      vi.mocked(executeStep).mockRejectedValueOnce(
        new Error("Detailed error message")
      );

      await POST(createRequest({}), { params: mockParams });

      expect(createOrUpdateStepExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: "run-123",
          stepId: "step-1",
          status: "failed",
          error: { message: "Detailed error message" },
        })
      );
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(executeStep).mockRejectedValueOnce("String error");

      const response = await POST(createRequest({}), { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Step execution failed: String error");
    });
  });

  describe("error handling", () => {
    it("should return 500 for unexpected errors", async () => {
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" });
      vi.mocked(getRunStatus).mockRejectedValueOnce(
        new Error("Unexpected database error")
      );

      const response = await POST(createRequest({}), { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Unexpected database error");
    });
  });
});
