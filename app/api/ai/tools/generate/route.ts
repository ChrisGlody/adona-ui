import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import OpenAI from "openai";

const openai = new OpenAI();

interface GeneratedTool {
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
  code: string;
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

    const systemPrompt = `You are a tool generator AI. Generate a tool definition based on the user's description.

A tool is a reusable function that can be called from workflows. Tools have:
- A name (snake_case, descriptive)
- A description (what the tool does)
- An inputSchema (JSON Schema for input parameters)
- An outputSchema (JSON Schema for the return value)
- Code (TypeScript/JavaScript async function)

Tool code signature:
\`\`\`typescript
export async function main(input) {
  // input contains the parameters defined in inputSchema
  // You can use fetch() for HTTP requests
  // Return an object matching outputSchema
  return { result: "..." };
}
\`\`\`

Guidelines:
- Use descriptive parameter names
- Include helpful descriptions in schemas
- Handle errors gracefully
- Use fetch() for any HTTP/API calls
- Return structured data that matches outputSchema
- Keep code clean and readable

Respond ONLY with valid JSON in this exact format:
{
  "name": "tool_name",
  "description": "What this tool does",
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
      "result": { "type": "string", "description": "Result description" }
    }
  },
  "code": "export async function main(input) {\\n  // implementation\\n  return { result: input.paramName };\\n}"
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

    let tool: GeneratedTool;
    try {
      tool = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON" },
        { status: 500 }
      );
    }

    // Validate the generated tool structure
    if (!tool.name || !tool.code) {
      return NextResponse.json(
        { error: "Invalid tool structure generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      tool,
      message: "Tool generated successfully",
    });
  } catch (error) {
    console.error("Error generating tool:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate tool" },
      { status: 500 }
    );
  }
}
