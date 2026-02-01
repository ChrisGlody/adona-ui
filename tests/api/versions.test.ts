import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// Mock auth
vi.mock("@/lib/auth.server", () => ({
  getAuthUser: vi.fn(),
}));

// Mock database queries
vi.mock("@/lib/db/queries", () => ({
  getWorkflowVersions: vi.fn(),
  getWorkflowVersion: vi.fn(),
  restoreWorkflowVersion: vi.fn(),
  compareWorkflowVersions: vi.fn(),
  getToolVersions: vi.fn(),
  getToolVersion: vi.fn(),
  restoreToolVersion: vi.fn(),
}));

describe("Workflow Version API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workflows/[id]/versions", () => {
    it("should return 401 when not authenticated", async () => {
      const { getAuthUser } = await import("@/lib/auth.server");
      vi.mocked(getAuthUser).mockResolvedValue(null);

      const { GET } = await import("@/app/api/workflows/[id]/versions/route");
      const response = await GET(
        new Request("http://localhost/api/workflows/123/versions"),
        { params: Promise.resolve({ id: "123" }) }
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 when workflow not found", async () => {
      const { getAuthUser } = await import("@/lib/auth.server");
      const { getWorkflowVersions } = await import("@/lib/db/queries");

      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" } as any);
      vi.mocked(getWorkflowVersions).mockResolvedValue(null);

      const { GET } = await import("@/app/api/workflows/[id]/versions/route");
      const response = await GET(
        new Request("http://localhost/api/workflows/123/versions"),
        { params: Promise.resolve({ id: "123" }) }
      );

      expect(response.status).toBe(404);
    });

    it("should return versions list when workflow exists", async () => {
      const { getAuthUser } = await import("@/lib/auth.server");
      const { getWorkflowVersions } = await import("@/lib/db/queries");

      const mockVersions = [
        { id: "v1", version: 2, changeType: "update", createdAt: new Date() },
        { id: "v2", version: 1, changeType: "create", createdAt: new Date() },
      ];

      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" } as any);
      vi.mocked(getWorkflowVersions).mockResolvedValue(mockVersions as any);

      const { GET } = await import("@/app/api/workflows/[id]/versions/route");
      const response = await GET(
        new Request("http://localhost/api/workflows/123/versions"),
        { params: Promise.resolve({ id: "123" }) }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.versions).toHaveLength(2);
      expect(data.versions[0].id).toBe("v1");
      expect(data.versions[1].id).toBe("v2");
    });
  });

  describe("GET /api/workflows/[id]/versions/[version]", () => {
    it("should return 400 for invalid version number", async () => {
      const { getAuthUser } = await import("@/lib/auth.server");
      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" } as any);

      const { GET } = await import("@/app/api/workflows/[id]/versions/[version]/route");
      const response = await GET(
        new Request("http://localhost/api/workflows/123/versions/invalid"),
        { params: Promise.resolve({ id: "123", version: "invalid" }) }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid version number");
    });

    it("should return 404 when version not found", async () => {
      const { getAuthUser } = await import("@/lib/auth.server");
      const { getWorkflowVersion } = await import("@/lib/db/queries");

      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" } as any);
      vi.mocked(getWorkflowVersion).mockResolvedValue(null);

      const { GET } = await import("@/app/api/workflows/[id]/versions/[version]/route");
      const response = await GET(
        new Request("http://localhost/api/workflows/123/versions/1"),
        { params: Promise.resolve({ id: "123", version: "1" }) }
      );

      expect(response.status).toBe(404);
    });

    it("should return version data when found", async () => {
      const { getAuthUser } = await import("@/lib/auth.server");
      const { getWorkflowVersion } = await import("@/lib/db/queries");

      const mockVersion = {
        id: "v1",
        version: 1,
        name: "Test Workflow",
        definition: { nodes: [], edges: [] },
      };

      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" } as any);
      vi.mocked(getWorkflowVersion).mockResolvedValue(mockVersion as any);

      const { GET } = await import("@/app/api/workflows/[id]/versions/[version]/route");
      const response = await GET(
        new Request("http://localhost/api/workflows/123/versions/1"),
        { params: Promise.resolve({ id: "123", version: "1" }) }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.version).toEqual(mockVersion);
    });
  });

  describe("POST /api/workflows/[id]/versions/[version]/restore", () => {
    it("should return 401 when not authenticated", async () => {
      const { getAuthUser } = await import("@/lib/auth.server");
      vi.mocked(getAuthUser).mockResolvedValue(null);

      const { POST } = await import("@/app/api/workflows/[id]/versions/[version]/restore/route");
      const response = await POST(
        new Request("http://localhost/api/workflows/123/versions/1/restore", {
          method: "POST",
          body: JSON.stringify({}),
        }),
        { params: Promise.resolve({ id: "123", version: "1" }) }
      );

      expect(response.status).toBe(401);
    });

    it("should restore version successfully", async () => {
      const { getAuthUser } = await import("@/lib/auth.server");
      const { restoreWorkflowVersion } = await import("@/lib/db/queries");

      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" } as any);
      vi.mocked(restoreWorkflowVersion).mockResolvedValue({ id: "123", version: 3 });

      const { POST } = await import("@/app/api/workflows/[id]/versions/[version]/restore/route");
      const response = await POST(
        new Request("http://localhost/api/workflows/123/versions/1/restore", {
          method: "POST",
          body: JSON.stringify({ changeMessage: "Restoring to v1" }),
        }),
        { params: Promise.resolve({ id: "123", version: "1" }) }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.version).toBe(3);
    });
  });
});

describe("Tool Version API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/tools/[id]/versions", () => {
    it("should return 401 when not authenticated", async () => {
      const { getAuthUser } = await import("@/lib/auth.server");
      vi.mocked(getAuthUser).mockResolvedValue(null);

      const { GET } = await import("@/app/api/tools/[id]/versions/route");
      const response = await GET(
        new Request("http://localhost/api/tools/123/versions"),
        { params: Promise.resolve({ id: "123" }) }
      );

      expect(response.status).toBe(401);
    });

    it("should return 404 when tool not found", async () => {
      const { getAuthUser } = await import("@/lib/auth.server");
      const { getToolVersions } = await import("@/lib/db/queries");

      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" } as any);
      vi.mocked(getToolVersions).mockResolvedValue(null);

      const { GET } = await import("@/app/api/tools/[id]/versions/route");
      const response = await GET(
        new Request("http://localhost/api/tools/123/versions"),
        { params: Promise.resolve({ id: "123" }) }
      );

      expect(response.status).toBe(404);
    });

    it("should return versions list when tool exists", async () => {
      const { getAuthUser } = await import("@/lib/auth.server");
      const { getToolVersions } = await import("@/lib/db/queries");

      const mockVersions = [
        { id: "v1", version: 2, changeType: "update", createdAt: new Date() },
        { id: "v2", version: 1, changeType: "create", createdAt: new Date() },
      ];

      vi.mocked(getAuthUser).mockResolvedValue({ sub: "user-123" } as any);
      vi.mocked(getToolVersions).mockResolvedValue(mockVersions as any);

      const { GET } = await import("@/app/api/tools/[id]/versions/route");
      const response = await GET(
        new Request("http://localhost/api/tools/123/versions"),
        { params: Promise.resolve({ id: "123" }) }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.versions).toHaveLength(2);
      expect(data.versions[0].id).toBe("v1");
      expect(data.versions[1].id).toBe("v2");
    });
  });
});
