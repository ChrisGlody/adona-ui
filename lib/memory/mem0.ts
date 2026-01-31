/**
 * Stub Mem0 memory for chat: no-op add/search, no external Qdrant.
 * Replace with full mem0 integration when QDRANT_URL etc. are configured.
 */
export interface MemoryMetadata {
  userId: string;
}

export class Mem0Memory {
  async add(_messages: { role: string; content: string }[], _context: MemoryMetadata): Promise<void> {
    // no-op
  }

  async search(_query: string, _context: MemoryMetadata): Promise<Array<{ id: string; content: string | undefined }>> {
    return [];
  }

  async get(_id: string): Promise<unknown> {
    return null;
  }

  async delete(_id: string): Promise<void> {
    // no-op
  }
}
