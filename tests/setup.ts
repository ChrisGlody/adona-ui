import { vi } from "vitest";

// Mock environment variables
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
process.env.OPENAI_API_KEY = "test-api-key";

// Mock console.error to avoid noise in tests (but still allow verification)
vi.spyOn(console, "error").mockImplementation(() => {});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
