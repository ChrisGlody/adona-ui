import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/workflows/create/route";

// Mock dependencies
vi.mock("@/lib/auth.server", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/db/queries", () => ({
  createAIWorkflow: vi.fn(),
}));

import { getAuthUser } from "@/lib/auth.server";
import { createAIWorkflow } from "@/lib/db/queries";

describe("POST /api/ai/workflows/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: unknown) => {
    return new Request("http://localhost/api/ai/workflows/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  describe("authentication", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getAuthUser).mockResolvedValueOnce(null);

      const response = await POST(createRequest({ name: "Test" }));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("validation", () => {
    beforeEach(() => {
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" });
    });

    it("should return 400 if name is missing", async () => {
      const response = await POST(
        createRequest({
          definition: { nodes: [], edges: [] },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields: name and definition");
    });

    it("should return 400 if definition is missing", async () => {
      const response = await POST(createRequest({ name: "Test Workflow" }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields: name and definition");
    });

    it("should return 400 if nodes array is missing", async () => {
      const response = await POST(
        createRequest({
          name: "Test Workflow",
          definition: { edges: [] },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid definition: missing or invalid nodes array");
    });

    it("should return 400 if edges array is missing", async () => {
      const response = await POST(
        createRequest({
          name: "Test Workflow",
          definition: { nodes: [] },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid definition: missing or invalid edges array");
    });

    it("should return 400 if node is missing id", async () => {
      const response = await POST(
        createRequest({
          name: "Test Workflow",
          definition: {
            nodes: [{ name: "Step 1", type: "inline" }],
            edges: [],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid node: missing id, name, or type");
    });

    it("should return 400 if node is missing name", async () => {
      const response = await POST(
        createRequest({
          name: "Test Workflow",
          definition: {
            nodes: [{ id: "step1", type: "inline" }],
            edges: [],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid node: missing id, name, or type");
    });

    it("should return 400 if node is missing type", async () => {
      const response = await POST(
        createRequest({
          name: "Test Workflow",
          definition: {
            nodes: [{ id: "step1", name: "Step 1" }],
            edges: [],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid node: missing id, name, or type");
    });

    it("should return 400 for invalid node type", async () => {
      const response = await POST(
        createRequest({
          name: "Test Workflow",
          definition: {
            nodes: [{ id: "step1", name: "Step 1", type: "invalid" }],
            edges: [],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid node type: invalid. Must be one of: tool, inline, http, memory"
      );
    });

    it("should return 400 if edge is missing source", async () => {
      const response = await POST(
        createRequest({
          name: "Test Workflow",
          definition: {
            nodes: [{ id: "step1", name: "Step 1", type: "inline" }],
            edges: [{ target: "step1" }],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid edge: missing source or target");
    });

    it("should return 400 if edge is missing target", async () => {
      const response = await POST(
        createRequest({
          name: "Test Workflow",
          definition: {
            nodes: [{ id: "step1", name: "Step 1", type: "inline" }],
            edges: [{ source: "step1" }],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid edge: missing source or target");
    });

    it("should return 400 if edge references non-existent source node", async () => {
      const response = await POST(
        createRequest({
          name: "Test Workflow",
          definition: {
            nodes: [{ id: "step1", name: "Step 1", type: "inline" }],
            edges: [{ source: "nonexistent", target: "step1" }],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid edge: references non-existent node");
    });

    it("should return 400 if edge references non-existent target node", async () => {
      const response = await POST(
        createRequest({
          name: "Test Workflow",
          definition: {
            nodes: [{ id: "step1", name: "Step 1", type: "inline" }],
            edges: [{ source: "step1", target: "nonexistent" }],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid edge: references non-existent node");
    });
  });

  describe("successful creation", () => {
    beforeEach(() => {
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" });
    });

    it("should create workflow with minimal definition", async () => {
      vi.mocked(createAIWorkflow).mockResolvedValueOnce("workflow-123");

      const response = await POST(
        createRequest({
          name: "Test Workflow",
          definition: { nodes: [], edges: [] },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.workflowId).toBe("workflow-123");
      expect(data.message).toBe("AI workflow created successfully");
    });

    it("should create workflow with full definition", async () => {
      vi.mocked(createAIWorkflow).mockResolvedValueOnce("workflow-456");

      const response = await POST(
        createRequest({
          id: "custom-id",
          name: "Full Workflow",
          description: "A complete workflow",
          inputSchema: { type: "object", properties: { input: { type: "string" } } },
          outputSchema: { type: "object", properties: { output: { type: "string" } } },
          definition: {
            nodes: [
              { id: "step1", name: "Step 1", type: "inline" },
              { id: "step2", name: "Step 2", type: "http" },
            ],
            edges: [{ id: "e1", source: "step1", target: "step2" }],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(createAIWorkflow).toHaveBeenCalledWith({
        id: "custom-id",
        owner: "user-123",
        name: "Full Workflow",
        description: "A complete workflow",
        inputSchema: { type: "object", properties: { input: { type: "string" } } },
        outputSchema: { type: "object", properties: { output: { type: "string" } } },
        definition: {
          nodes: [
            { id: "step1", name: "Step 1", type: "inline" },
            { id: "step2", name: "Step 2", type: "http" },
          ],
          edges: [{ id: "e1", source: "step1", target: "step2" }],
        },
      });
    });

    it("should accept all valid node types", async () => {
      vi.mocked(createAIWorkflow).mockResolvedValueOnce("workflow-789");

      const response = await POST(
        createRequest({
          name: "Multi-Type Workflow",
          definition: {
            nodes: [
              { id: "tool-step", name: "Tool Step", type: "tool", toolId: "t1" },
              { id: "inline-step", name: "Inline Step", type: "inline", code: "fn main(){}" },
              { id: "http-step", name: "HTTP Step", type: "http", url: "https://example.com" },
              { id: "memory-step", name: "Memory Step", type: "memory", operation: "search" },
            ],
            edges: [],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should return 500 if database operation fails", async () => {
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" });
      vi.mocked(createAIWorkflow).mockRejectedValueOnce(
        new Error("Database connection failed")
      );

      const response = await POST(
        createRequest({
          name: "Test Workflow",
          definition: { nodes: [], edges: [] },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Database connection failed");
    });
  });
});
