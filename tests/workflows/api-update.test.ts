import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT } from "@/app/api/ai/workflows/update/route";

// Mock dependencies
vi.mock("@/lib/auth.server", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/db/queries", () => ({
  createAIWorkflow: vi.fn(),
  getWorkflowWithSteps: vi.fn(),
}));

import { getAuthUser } from "@/lib/auth.server";
import { createAIWorkflow, getWorkflowWithSteps } from "@/lib/db/queries";

describe("PUT /api/ai/workflows/update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: unknown) => {
    return new Request("http://localhost/api/ai/workflows/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const mockExistingWorkflow = {
    id: "workflow-123",
    owner: "user-123",
    name: "Original Workflow",
    description: "Original description",
    definition: { nodes: [], edges: [] },
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    executionEnv: "db",
    definitionVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("authentication", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getAuthUser).mockResolvedValueOnce(null);

      const response = await PUT(createRequest({ id: "workflow-123" }));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("validation", () => {
    beforeEach(() => {
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" });
    });

    it("should return 400 if id is missing", async () => {
      const response = await PUT(createRequest({ name: "New Name" }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required field: id");
    });

    it("should return 404 if workflow does not exist", async () => {
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce(null);

      const response = await PUT(createRequest({ id: "non-existent" }));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Workflow not found");
    });

    it("should return 400 if definition nodes is not an array", async () => {
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce(mockExistingWorkflow);

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          definition: { nodes: "invalid", edges: [] },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid definition: missing or invalid nodes array");
    });

    it("should return 400 if definition edges is not an array", async () => {
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce(mockExistingWorkflow);

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          definition: { nodes: [], edges: "invalid" },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid definition: missing or invalid edges array");
    });

    it("should return 400 for invalid node in definition", async () => {
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce(mockExistingWorkflow);

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          definition: {
            nodes: [{ name: "Missing id and type" }],
            edges: [],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid node: missing id, name, or type");
    });

    it("should return 400 for invalid node type", async () => {
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce(mockExistingWorkflow);

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          definition: {
            nodes: [{ id: "s1", name: "Step", type: "invalid-type" }],
            edges: [],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid node type: invalid-type");
    });

    it("should return 400 for edge with missing source", async () => {
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce(mockExistingWorkflow);

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          definition: {
            nodes: [{ id: "s1", name: "Step", type: "inline" }],
            edges: [{ target: "s1" }],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid edge: missing source or target");
    });

    it("should return 400 for edge referencing non-existent node", async () => {
      vi.mocked(getWorkflowWithSteps).mockResolvedValueOnce(mockExistingWorkflow);

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          definition: {
            nodes: [{ id: "s1", name: "Step", type: "inline" }],
            edges: [{ source: "s1", target: "nonexistent" }],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid edge: references non-existent node");
    });
  });

  describe("successful update", () => {
    beforeEach(() => {
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" });
      vi.mocked(getWorkflowWithSteps).mockResolvedValue(mockExistingWorkflow);
    });

    it("should update workflow name only", async () => {
      vi.mocked(createAIWorkflow).mockResolvedValueOnce("workflow-123");

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          name: "Updated Name",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.workflowId).toBe("workflow-123");
      expect(createAIWorkflow).toHaveBeenCalledWith({
        id: "workflow-123",
        owner: "user-123",
        name: "Updated Name",
        description: "Original description",
        inputSchema: { type: "object" },
        outputSchema: { type: "object" },
        definition: { nodes: [], edges: [] },
      });
    });

    it("should update workflow description only", async () => {
      vi.mocked(createAIWorkflow).mockResolvedValueOnce("workflow-123");

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          description: "Updated description",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(createAIWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Original Workflow",
          description: "Updated description",
        })
      );
    });

    it("should update workflow definition", async () => {
      vi.mocked(createAIWorkflow).mockResolvedValueOnce("workflow-123");

      const newDefinition = {
        nodes: [{ id: "new-step", name: "New Step", type: "inline" }],
        edges: [],
      };

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          definition: newDefinition,
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(createAIWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          definition: newDefinition,
        })
      );
    });

    it("should update input and output schemas", async () => {
      vi.mocked(createAIWorkflow).mockResolvedValueOnce("workflow-123");

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          inputSchema: { type: "object", properties: { newInput: { type: "number" } } },
          outputSchema: { type: "array", items: { type: "string" } },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(createAIWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          inputSchema: { type: "object", properties: { newInput: { type: "number" } } },
          outputSchema: { type: "array", items: { type: "string" } },
        })
      );
    });

    it("should allow setting description to null", async () => {
      vi.mocked(createAIWorkflow).mockResolvedValueOnce("workflow-123");

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          description: null,
        })
      );

      expect(response.status).toBe(200);
      expect(createAIWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
        })
      );
    });

    it("should update multiple fields at once", async () => {
      vi.mocked(createAIWorkflow).mockResolvedValueOnce("workflow-123");

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          name: "Fully Updated",
          description: "New description",
          definition: {
            nodes: [
              { id: "a", name: "A", type: "inline" },
              { id: "b", name: "B", type: "inline" },
            ],
            edges: [{ source: "a", target: "b" }],
          },
          inputSchema: { type: "string" },
          outputSchema: { type: "number" },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("AI workflow updated successfully");
    });

    it("should not update definition if not provided", async () => {
      vi.mocked(createAIWorkflow).mockResolvedValueOnce("workflow-123");

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          name: "Name Only Update",
        })
      );

      expect(response.status).toBe(200);
      expect(createAIWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          definition: { nodes: [], edges: [] },
        })
      );
    });
  });

  describe("error handling", () => {
    it("should return 500 if database operation fails", async () => {
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" });
      vi.mocked(getWorkflowWithSteps).mockResolvedValue(mockExistingWorkflow);
      vi.mocked(createAIWorkflow).mockRejectedValueOnce(
        new Error("Database error")
      );

      const response = await PUT(
        createRequest({
          id: "workflow-123",
          name: "Updated",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Database error");
    });
  });
});
