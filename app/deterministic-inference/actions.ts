"use server";

export interface DeterminismTestParams {
  host?: string;
  port?: string;
  prompt: string;
  numTests: number;
  temperature: number;
  topP: number;
  topK: number;
  seed: number;
}

export interface DeterminismTestResult {
  outputs: string[];
  deterministic: boolean;
  error?: string;
}

export interface InferenceConfig {
  host: string;
  port: string;
}

// Get the system-configured inference endpoint
export async function getInferenceConfig(): Promise<InferenceConfig> {
  return {
    host: process.env.INFERENCE_HOST || "localhost",
    port: process.env.INFERENCE_PORT || "8000",
  };
}

export async function testDeterminism(
  params: DeterminismTestParams
): Promise<DeterminismTestResult> {
  // Use system env vars as defaults, allow override for testing
  const systemConfig = await getInferenceConfig();
  const host = params.host?.trim() || systemConfig.host;
  const port = params.port?.trim() || systemConfig.port;
  const { prompt, numTests, temperature, topP, topK, seed } = params;

  if (!host || !port) {
    return { outputs: [], deterministic: false, error: "Host and port are required (set INFERENCE_HOST/INFERENCE_PORT env vars or provide manually)" };
  }
  if (!prompt.trim()) {
    return { outputs: [], deterministic: false, error: "Prompt is required" };
  }
  if (numTests < 1 || numTests > 100) {
    return { outputs: [], deterministic: false, error: "Number of tests must be between 1 and 100" };
  }

  const baseUrl =
    host.startsWith("http://") || host.startsWith("https://")
      ? `${host}:${port}`
      : `http://${host}:${port}`;
  const url = `${baseUrl}/generate`;
  const outputs: string[] = [];

  try {
    for (let i = 0; i < numTests; i++) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompts: [prompt],
          temperature,
          top_p: topP,
          top_k: topK,
          seed,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.outputs || !Array.isArray(data.outputs) || data.outputs.length === 0) {
        throw new Error("Invalid response format: missing outputs");
      }
      outputs.push(data.outputs[0]);
    }
    const deterministic = outputs.length > 0 && outputs.every((o) => o === outputs[0]);
    return { outputs, deterministic };
  } catch (error) {
    return {
      outputs,
      deterministic: false,
      error: error instanceof Error ? error.message : "Unknown error occurred while calling API",
    };
  }
}
