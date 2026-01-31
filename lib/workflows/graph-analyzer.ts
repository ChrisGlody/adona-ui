export interface WorkflowStep {
  id: string;
  name: string;
  type: "tool" | "inline" | "memory" | "llm" | "inference";
  description?: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
  toolId?: string;
  code?: string;
  operation?: "search" | "add" | "update" | "delete" | "get" | "getAll" | "deleteAll";
  queryExpression?: string;
  memoryIdExpression?: string;
  inputMapping?: string;
  // LLM step fields
  model?: string;
  systemPrompt?: string;
  userPromptExpression?: string;
  temperature?: number;
  maxTokens?: number;
  // Inference step fields (host/port via system env vars)
  promptExpression?: string;
  topP?: number;
  topK?: number;
  seed?: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowStep[];
  edges: WorkflowEdge[];
}

export interface CompletedStep {
  stepId: string;
  output: unknown;
}

export interface ExecutableStep {
  stepId: string;
  name: string;
  description?: string;
  type: string;
  inputSchema?: unknown;
}

export function getNextExecutableSteps(
  workflow: WorkflowDefinition,
  completedSteps: CompletedStep[],
  stepOutputs: Record<string, unknown> = {},
  workflowInput: unknown = {}
): ExecutableStep[] {
  const { nodes, edges } = workflow;
  const dependencies = new Map<string, string[]>();
  nodes.forEach((node) => dependencies.set(node.id, []));
  edges.forEach((edge) => {
    const deps = dependencies.get(edge.target) ?? [];
    deps.push(edge.source);
    dependencies.set(edge.target, deps);
  });
  const completedStepIds = new Set(completedSteps.map((s) => s.stepId));
  const executableSteps: ExecutableStep[] = [];

  for (const node of nodes) {
    if (completedStepIds.has(node.id)) continue;
    const nodeDeps = dependencies.get(node.id) ?? [];
    const allDepsCompleted = nodeDeps.every((depId) => completedStepIds.has(depId));
    if (!allDepsCompleted) continue;
    const incomingEdges = edges.filter((e) => e.target === node.id);
    let canExecute = true;
    for (const edge of incomingEdges) {
      if (edge.condition) {
        try {
          const context = { workflowInput, stepOutputs };
          const fn = new Function("context", `return (${edge.condition});`);
          if (!fn(context)) {
            canExecute = false;
            break;
          }
        } catch {
          canExecute = false;
          break;
        }
      }
    }
    if (canExecute) {
      executableSteps.push({
        stepId: node.id,
        name: node.name,
        description: node.description,
        type: node.type,
        inputSchema: node.inputSchema,
      });
    }
  }
  return executableSteps;
}

export function isWorkflowComplete(
  workflow: WorkflowDefinition,
  completedSteps: CompletedStep[]
): boolean {
  const { nodes } = workflow;
  const completedStepIds = new Set(completedSteps.map((s) => s.stepId));
  return nodes.every((node) => completedStepIds.has(node.id));
}
