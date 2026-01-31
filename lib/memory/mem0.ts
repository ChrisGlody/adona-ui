import { Memory, Message } from '../mem0/oss/src';

export interface MemoryMetadata {
  userId: string;
}

export class Mem0Memory {
  private client: Memory;

  constructor() {
    // Initialize with environment variables
    this.client = new Memory({
        version: 'v1.1',
        embedder: {
          provider: 'openai',
          config: {
            apiKey: process.env.OPENAI_API_KEY || '',
            model: 'text-embedding-3-small',
          },
        },
        vectorStore: {
            provider: "qdrant",
            config: {
              collectionName: "workflow-memory",
              url: process.env.QDRANT_URL,
              apiKey: process.env.QDRANT_API_KEY,
            },
        },
        llm: {
          provider: 'openai',
          config: {
            apiKey: process.env.OPENAI_API_KEY || '',
            model: 'gpt-4o-mini',
          },
        },
        disableHistory: true
      });
  }

  async add(messages: Message[], context: MemoryMetadata): Promise<void> {
    try {
      console.log(`[Memory] Adding memory for user: ${context.userId}`);

      await this.client.add(messages, {
        userId: context.userId,
        metadata: {
          timestamp: Date.now(),
        }
      });

      console.log('[Memory] Memory added successfully');
    } catch (error) {
      console.error('[Memory] Failed to add memory:', error);
      throw error;
    }
  }

  async search(query: string, context: MemoryMetadata): Promise<Array<{ id: string; content: string | undefined }>> {
    try {
      console.log(`[Memory] Searching memory for user: ${context.userId}, query: ${query}`);

      const results = await this.client.search(query, {
        userId: context.userId,
        limit: 10
      });

      // Transform mem0 results to match the interface
      const memories = results.results.map((result) => ({
        id: result.id,
        content: result.memory
      }));

      console.log(`[Memory] Found ${memories.length} memories`);
      return memories;
    } catch (error) {
      console.error('[Memory] Failed to search memory:', error);
      return []; // Return empty array on error to not block operations
    }
  }

  async get(id: string): Promise<unknown> {
    try {
      console.log(`[Memory] Getting memory: ${id}`);
      return await this.client.get(id);
    } catch (error) {
      console.error('[Memory] Failed to get memory:', error);
      return null;
    }
  }

  async update(id: string, content: string): Promise<void> {
    try {
      console.log(`[Memory] Updating memory: ${id}`);
      await this.client.update(id, content);
      console.log('[Memory] Memory updated successfully');
    } catch (error) {
      console.error('[Memory] Failed to update memory:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      console.log(`[Memory] Deleting memory: ${id}`);
      await this.client.delete(id);
      console.log('[Memory] Memory deleted successfully');
    } catch (error) {
      console.error('[Memory] Failed to delete memory:', error);
      throw error;
    }
  }

  async getAll(context: MemoryMetadata): Promise<Array<{ id: string; content: string | undefined }>> {
    try {
      console.log(`[Memory] Getting all memories for user: ${context.userId}`);

      const results = await this.client.getAll({
        userId: context.userId,
        limit: 100
      });

      const memories = results.results.map((result) => ({
        id: result.id,
        content: result.memory
      }));

      console.log(`[Memory] Found ${memories.length} memories`);
      return memories;
    } catch (error) {
      console.error('[Memory] Failed to get all memories:', error);
      return [];
    }
  }

  async deleteAll(context: MemoryMetadata): Promise<void> {
    try {
      console.log(`[Memory] Deleting all memories for user: ${context.userId}`);
      await this.client.deleteAll({ userId: context.userId });
      console.log('[Memory] All memories deleted successfully');
    } catch (error) {
      console.error('[Memory] Failed to delete all memories:', error);
      throw error;
    }
  }
}
