import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/workflows/run/route";

// Mock dependencies
vi.mock("@/lib/auth.server", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/db/queries", () => ({
  getWorkflowWithSteps: vi.fn(),
  createWorkflowRun: vi.fn(),
}));

vi.mock("@/lib/workflows/graph-analyzer", () => ({
  getNextExecutableSteps: vi.fn(),
}));

import { getAuthUser } from "@/lib/auth.server";
import { getWorkflowWithSteps, createWorkflowRun } from "@/lib/db/queries";
import { getNextExecutableSteps } from "@/lib/workflows/graph-analyzer";

describe("POST /api/ai/workflows/run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: unknown) => {
    return new Request("http://localhost/api/ai/workflows/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const mockWorkflow = {
    id: "workflow-123",
    owner: "user-123",
    name: "Test Workflow",
    description: "A test workflow",
    definition: {
      nodes: [
        { id: "step1", name: "Step 1", type: "inline" },
        { id: "step2", name: "Step 2", type: "http" },
      ],
      edges: [{ id: "e1", source: "step1", target: "step2" }],
    },
    executionEnv: "db",
    inputSchema: { type: "object" },
    outputSchema: null,
    definitionVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("authentication", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getAuthUser).mockResolvedValueOnce(null);

      const response = await POST(
        createRequest({ workflowId: "workflow-123" })
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("validation", () => {
    beforeEach(() => {
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" });
    });

    it("should return 400 if workflowId is missing", async () => {
      const response = await POST(createRequest({ input: {} }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required field: workflowId");
    });

    it("should return 404 if workflow does not exist", async () => {
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce(null);

      const response = await POST(
        createRequest({ workflowId: "non-existent" })
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Workflow not found");
    });

    it("should return 400 if workflow is not an AI workflow", async () => {
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce({
        ...mockWorkflow,
        executionEnv: "s3",
      });

      const response = await POST(
        createRequest({ workflowId: "workflow-123" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "This endpoint only supports AI workflows (executionEnv = 'db')"
      );
    });

    it("should return 400 if input does not match schema", async () => {
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce({
        ...mockWorkflow,
        inputSchema: { type: "object" },
      });

      const response = await POST(
        createRequest({
          workflowId: "workflow-123",
          input: "not an object",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Input does not match workflow input schema");
    });
  });

  describe("successful run initialization", () => {
    beforeEach(() => {
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" });
      vi.mocked(getWorkflowWithSteps).mockResolvedValue(mockWorkflow);
      vi.mocked(createWorkflowRun).mockResolvedValue("run-456");
    });

    it("should create a workflow run and return next steps", async () => {
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([
        {
          stepId: "step1",
          name: "Step 1",
          type: "inline",
          description: undefined,
          inputSchema: undefined,
        },
      ]);

      const response = await POST(
        createRequest({
          workflowId: "workflow-123",
          input: { data: "test" },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.runId).toBe("run-456");
      expect(data.workflowId).toBe("workflow-123");
      expect(data.nextSteps).toHaveLength(1);
      expect(data.nextSteps[0].stepId).toBe("step1");
      expect(data.isComplete).toBe(false);
      expect(data.message).toBe("Workflow run initialized successfully");
    });

    it("should return isComplete true if no executable steps", async () => {
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([]);

      const response = await POST(
        createRequest({
          workflowId: "workflow-123",
          input: {},
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isComplete).toBe(true);
      expect(data.nextSteps).toEqual([]);
    });

    it("should return multiple executable steps for parallel nodes", async () => {
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([
        { stepId: "parallel1", name: "Parallel 1", type: "inline" },
        { stepId: "parallel2", name: "Parallel 2", type: "http" },
      ]);

      const response = await POST(
        createRequest({
          workflowId: "workflow-123",
          input: {},
        })
      );
      const data = await response.json();

      expect(data.nextSteps).toHaveLength(2);
      expect(data.nextSteps.map((s: { stepId: string }) => s.stepId)).toEqual([
        "parallel1",
        "parallel2",
      ]);
    });

    it("should handle null input with no input schema", async () => {
      // Override mock to have no inputSchema
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce({
        ...mockWorkflow,
        inputSchema: null,
      });
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([]);

      const response = await POST(
        createRequest({
          workflowId: "workflow-123",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(createWorkflowRun).toHaveBeenCalledWith({
        workflowId: "workflow-123",
        owner: "user-123",
        input: {},
      });
    });

    it("should pass correct arguments to createWorkflowRun", async () => {
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([]);

      await POST(
        createRequest({
          workflowId: "workflow-123",
          input: { key: "value" },
        })
      );

      expect(createWorkflowRun).toHaveBeenCalledWith({
        workflowId: "workflow-123",
        owner: "user-123",
        input: { key: "value" },
      });
    });

    it("should pass workflow definition to getNextExecutableSteps", async () => {
      vi.mocked(getNextExecutableSteps).mockReturnValueOnce([]);

      await POST(
        createRequest({
          workflowId: "workflow-123",
          input: {},
        })
      );

      expect(getNextExecutableSteps).toHaveBeenCalledWith(
        mockWorkflow.definition,
        [],
        {}
      );
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" });
      vi.mocked(getWorkflowWithSteps).mockResolvedValue(mockWorkflow);
    });

    it("should return 500 if createWorkflowRun fails", async () => {
      vi.mocked(createWorkflowRun).mockRejectedValueOnce(
        new Error("Database error")
      );

      const response = await POST(
        createRequest({
          workflowId: "workflow-123",
          input: {},
        })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Database error");
    });

    it("should return generic error message for non-Error exceptions", async () => {
      vi.mocked(createWorkflowRun).mockRejectedValueOnce("String error");

      const response = await POST(
        createRequest({
          workflowId: "workflow-123",
          input: {},
        })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to initialize workflow run");
    });
  });
});
