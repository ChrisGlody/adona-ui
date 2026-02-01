import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockResolvedValue([]),
        }),
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

vi.mock("ai", () => ({
  generateId: vi.fn().mockReturnValue("test-generated-id"),
}));

describe("Workflow Versioning Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createWorkflowVersion", () => {
    it("should create a version snapshot with correct data", async () => {
      const { createWorkflowVersion } = await import("@/lib/db/queries");
      const { db } = await import("@/lib/db");

      const result = await createWorkflowVersion({
        workflowId: "workflow-123",
        version: 1,
        snapshot: {
          name: "Test Workflow",
          description: "A test workflow",
          definition: { nodes: [], edges: [] },
          executionEnv: "db",
        },
        changedBy: "user-123",
        changeType: "create",
        changeMessage: "Initial version",
      });

      expect(result).toBe("test-generated-id");
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe("getWorkflowVersions", () => {
    it("should return null for non-existent workflow", async () => {
      const { getWorkflowVersions } = await import("@/lib/db/queries");

      const result = await getWorkflowVersions("non-existent", "user-123");

      expect(result).toBeNull();
    });
  });

  describe("getWorkflowVersion", () => {
    it("should return null for non-existent workflow", async () => {
      const { getWorkflowVersion } = await import("@/lib/db/queries");

      const result = await getWorkflowVersion("non-existent", 1, "user-123");

      expect(result).toBeNull();
    });
  });

  describe("compareWorkflowVersions", () => {
    it("should return both versions for comparison", async () => {
      const { compareWorkflowVersions } = await import("@/lib/db/queries");

      const result = await compareWorkflowVersions("workflow-123", 1, 2, "user-123");

      expect(result).toHaveProperty("versionA");
      expect(result).toHaveProperty("versionB");
    });
  });
});

describe("Tool Versioning Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createToolVersion", () => {
    it("should create a tool version snapshot with correct data", async () => {
      const { createToolVersion } = await import("@/lib/db/queries");
      const { db } = await import("@/lib/db");

      const result = await createToolVersion({
        toolId: "tool-123",
        version: 1,
        snapshot: {
          name: "Test Tool",
          description: "A test tool",
          type: "db",
          inputSchema: { type: "object", properties: {} },
          executionEnv: "db",
        },
        changedBy: "user-123",
        changeType: "create",
        changeMessage: "Initial version",
      });

      expect(result).toBe("test-generated-id");
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe("getToolVersions", () => {
    it("should return null for non-existent tool", async () => {
      const { getToolVersions } = await import("@/lib/db/queries");

      const result = await getToolVersions("non-existent", "user-123");

      expect(result).toBeNull();
    });
  });

  describe("getToolVersion", () => {
    it("should return null for non-existent tool", async () => {
      const { getToolVersion } = await import("@/lib/db/queries");

      const result = await getToolVersion("non-existent", 1, "user-123");

      expect(result).toBeNull();
    });
  });

  describe("compareToolVersions", () => {
    it("should return both versions for comparison", async () => {
      const { compareToolVersions } = await import("@/lib/db/queries");

      const result = await compareToolVersions("tool-123", 1, 2, "user-123");

      expect(result).toHaveProperty("versionA");
      expect(result).toHaveProperty("versionB");
    });
  });
});
