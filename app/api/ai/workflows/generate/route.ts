import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { getUserTools } from "@/lib/db/queries";
import OpenAI from "openai";

const openai = new OpenAI();

interface GeneratedNode {
  id: string;
  name: string;
  type: "tool" | "inline" | "http" | "memory";
  description?: string;
  toolId?: string;
  url?: string;
  code?: string;
  operation?: "search" | "add";
  queryExpression?: string;
  inputMapping?: string;
  x?: number;
  y?: number;
}

interface GeneratedEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

interface EnvVar {
  key: string;
  value: string;
  isSecret: boolean;
}

interface GeneratedWorkflow {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
  outputSchema: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
  };
  envVars?: EnvVar[];
  definition: {
    nodes: GeneratedNode[];
    edges: GeneratedEdge[];
  };
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing required field: prompt" },
        { status: 400 }
      );
    }

    // Get user's available tools to help the AI understand what's available
    const userTools = await getUserTools(user.sub);
    const toolsDescription = userTools.length > 0
      ? `Available tools:\n${userTools.map(t => `- ${t.name} (id: ${t.id}): ${t.description || "No description"}`).join("\n")}`
      : "No custom tools available. Use inline code, http, or memory steps.";

    const systemPrompt = `You are a workflow designer AI. Generate a workflow definition based on the user's description.

${toolsDescription}

You can create workflows with the following step types:
1. "tool" - Uses a registered tool (requires toolId from available tools)
2. "inline" - Custom JavaScript/TypeScript code with signature: export async function main(input, context) { return result; }
3. "http" - Makes HTTP POST requests to a URL
4. "memory" - Searches or adds to semantic memory (operations: "search" or "add")

IMPORTANT: How data flows between steps:
- The FIRST step receives the workflow's input parameters directly (e.g., input.inputValue)
- SUBSEQUENT steps receive the OUTPUT of the previous step as their input (e.g., if step_1 returns {incrementedValue: 2}, step_2 receives input.incrementedValue)
- The 'context' parameter provides access to:
  - context.workflowInput: the original workflow input (for accessing initial parameters in any step)
  - context.stepOutputs: a map of all completed step outputs (e.g., context.stepOutputs.step_1.value)
  - context.userId: the current user's ID
  - context.env: environment variables (e.g., context.env.API_KEY)

ENVIRONMENT VARIABLES:
- When the workflow needs API keys, tokens, secrets, or configuration values, create environment variables
- NEVER hardcode API keys or secrets in the code - always use context.env.VARIABLE_NAME
- Add envVars array with placeholder values that the user should fill in
- Mark secrets with isSecret: true (API keys, tokens, passwords)
- Use UPPER_SNAKE_CASE for variable names (e.g., OPENWEATHER_API_KEY, BASE_URL)
- In code, access env vars as: const apiKey = context.env.API_KEY;
- For URLs, use JavaScript template literals: const url = \`\${context.env.BASE_URL}/endpoint?key=\${context.env.API_KEY}\`;
- DO NOT use {{variable}} syntax - use JavaScript backtick template literals with \${variable}

Guidelines:
- Create meaningful step names that describe what each step does
- Connect steps with edges to define the execution order
- Use conditions on edges for branching logic (JS expressions like: context.stepOutputs.stepId.value > 10)
- Position nodes in a readable layout (x: 0-500, y increases by 100-150 per row)
- Include input/output schemas that match the workflow's purpose
- For inline code: the first step uses input parameters directly, subsequent steps use the previous step's output via 'input'
- If you need the original workflow input in a later step, use context.workflowInput

Respond ONLY with valid JSON in this exact format:
{
  "name": "Workflow Name",
  "description": "What this workflow does",
  "inputSchema": {
    "type": "object",
    "properties": {
      "paramName": { "type": "string", "description": "Parameter description" }
    },
    "required": ["paramName"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "resultName": { "type": "string", "description": "Result description" }
    }
  },
  "envVars": [
    { "key": "API_KEY", "value": "<your-api-key-here>", "isSecret": true },
    { "key": "BASE_URL", "value": "https://api.example.com", "isSecret": false }
  ],
  "definition": {
    "nodes": [
      {
        "id": "step_1",
        "name": "Fetch Data",
        "type": "inline",
        "description": "Fetches data from API",
        "code": "export async function main(input, context) {\\n  const apiKey = context.env.API_KEY;\\n  const baseUrl = context.env.BASE_URL;\\n  const url = \`\${baseUrl}/endpoint?key=\${apiKey}&q=\${input.query}\`;\\n  const response = await fetch(url);\\n  return response.json();\\n}",
        "x": 100,
        "y": 100
      }
    ],
    "edges": [
      { "id": "e_1", "source": "step_1", "target": "step_2" }
    ]
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    let workflow: GeneratedWorkflow;
    try {
      workflow = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON" },
        { status: 500 }
      );
    }

    // Validate the generated workflow structure
    if (!workflow.name || !workflow.definition) {
      return NextResponse.json(
        { error: "Invalid workflow structure generated" },
        { status: 500 }
      );
    }

    // Ensure all nodes have required fields
    if (workflow.definition.nodes) {
      workflow.definition.nodes = workflow.definition.nodes.map((node, index) => ({
        ...node,
        id: node.id || `step_${index + 1}`,
        name: node.name || `Step ${index + 1}`,
        type: node.type || "inline",
        x: node.x ?? 100 + (index % 3) * 200,
        y: node.y ?? 100 + Math.floor(index / 3) * 150,
      }));
    }

    // Ensure edges have IDs
    if (workflow.definition.edges) {
      workflow.definition.edges = workflow.definition.edges.map((edge, index) => ({
        ...edge,
        id: edge.id || `e_${index + 1}`,
      }));
    }

    return NextResponse.json({
      ok: true,
      workflow,
      message: "Workflow generated successfully",
    });
  } catch (error) {
    console.error("Error generating workflow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate workflow" },
      { status: 500 }
    );
  }
}
