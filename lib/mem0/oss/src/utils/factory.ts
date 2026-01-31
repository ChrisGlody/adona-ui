import { OpenAIEmbedder } from "../embeddings/openai";
import { OpenAILLM } from "../llms/openai";
import { OpenAIStructuredLLM } from "../llms/openai_structured";
import {
  EmbeddingConfig,
  HistoryStoreConfig,
  LLMConfig,
  VectorStoreConfig,
} from "../types";
import { Embedder } from "../embeddings/base";
import { LLM } from "../llms/base";
import { VectorStore } from "../vector_stores/base";
import { Qdrant } from "../vector_stores/qdrant";
import { MemoryHistoryManager } from "../storage/MemoryHistoryManager";
import { HistoryManager } from "../storage/base";

export class EmbedderFactory {
  static create(provider: string, config: EmbeddingConfig): Embedder {
    switch (provider.toLowerCase()) {
      case "openai":
        return new OpenAIEmbedder(config);
      default:
        throw new Error(`Unsupported embedder provider: ${provider}. Only 'openai' is supported.`);
    }
  }
}

export class LLMFactory {
  static create(provider: string, config: LLMConfig): LLM {
    switch (provider.toLowerCase()) {
      case "openai":
        return new OpenAILLM(config);
      case "openai_structured":
        return new OpenAIStructuredLLM(config);
      default:
        throw new Error(`Unsupported LLM provider: ${provider}. Only 'openai' and 'openai_structured' are supported.`);
    }
  }
}

export class VectorStoreFactory {
  static create(provider: string, config: VectorStoreConfig): VectorStore {
    switch (provider.toLowerCase()) {
      case "qdrant":
        return new Qdrant(config as any);
      default:
        throw new Error(`Unsupported vector store provider: ${provider}. Only 'qdrant' is supported.`);
    }
  }
}

export class HistoryManagerFactory {
  static create(provider: string, config: HistoryStoreConfig): HistoryManager {
    switch (provider.toLowerCase()) {
      case "memory":
        return new MemoryHistoryManager();
      default:
        throw new Error(`Unsupported history store provider: ${provider}`);
    }
  }
}
