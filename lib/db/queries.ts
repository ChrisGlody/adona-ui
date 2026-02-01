import { db } from "./index";
import {
  chats,
  chatMessages,
  tools,
  workflows,
  workflowRuns,
  workflowRunSteps,
  workflowVersions,
  toolVersions,
} from "./schema";
import { and, asc, desc, eq, inArray, count, sql } from "drizzle-orm";
import { generateId } from "ai";
import type { ModelMessage } from "ai";

export async function createChat(userId: string): Promise<string> {
  const id = generateId();
  await db.insert(chats).values({ id, userId, title: null });
  return id;
}

export async function getUserChats(userId: string) {
  return db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt));
}

export async function loadChat(
  chatId: string,
  userId: string
): Promise<ModelMessage[]> {
  const own = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1);

  if (own.length === 0) return [];

  const rows = await db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(eq(chatMessages.chatId, chatId))
    .orderBy(asc(chatMessages.createdAt));

  const messages = rows.map((r) => ({
    role: r.role as "system" | "user" | "assistant",
    content: r.content as object,
  })) as unknown as ModelMessage[];

  return messages;
}

function titleFromModelMessages(messages: ModelMessage[]): string | null {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return null;
  const text =
    typeof firstUser.content === "string"
      ? firstUser.content
      : Array.isArray(firstUser.content)
        ? (firstUser.content as { type?: string; text?: string }[])
            .map((p) => (p?.type === "text" ? p.text : ""))
            .join(" ")
        : "";
  const trimmed = text.trim();
  return trimmed ? trimmed.slice(0, 60) : null;
}

export async function saveChat({
  chatId,
  userId,
  messages,
}: {
  chatId: string;
  userId: string;
  messages: ModelMessage[];
}): Promise<void> {
  const exists = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1);

  if (exists.length === 0) {
    await db.insert(chats).values({
      id: chatId,
      userId,
      title: titleFromModelMessages(messages),
    });
  }

  const nowTitle = titleFromModelMessages(messages);

  await db
    .update(chats)
    .set({ updatedAt: new Date(), ...(nowTitle ? { title: nowTitle } : {}) })
    .where(eq(chats.id, chatId));

  await db.delete(chatMessages).where(eq(chatMessages.chatId, chatId));

  const inserts = messages.map((m) => ({
    id: generateId(),
    chatId,
    role: m.role,
    content: m.content as object,
    createdAt: new Date(),
  }));

  if (inserts.length > 0) {
    await db.insert(chatMessages).values(inserts);
  }
}

export async function getUserTools(owner: string) {
  return db.select().from(tools).where(eq(tools.owner, owner));
}

export async function getUserTool(id: string, owner: string) {
  return db
    .select()
    .from(tools)
    .where(and(eq(tools.id, id), eq(tools.owner, owner)));
}

export async function createOrUpdateWorkflow({
  id,
  owner,
  name,
  description,
  definition,
}: {
  id?: string;
  owner: string;
  name: string;
  description?: string | null;
  definition: object;
}) {
  const wfId = id ?? generateId();
  const row = {
    id: wfId,
    owner,
    name,
    description: description ?? null,
    definitionVersion: 1,
    definition,
    updatedAt: new Date(),
  } as Record<string, unknown>;

  const existing = await db
    .select({ id: workflows.id })
    .from(workflows)
    .where(eq(workflows.id, wfId))
    .limit(1);
  if (existing.length > 0) {
    await db.update(workflows).set(row).where(eq(workflows.id, wfId));
  } else {
    (row as Record<string, unknown>).createdAt = new Date();
    await db.insert(workflows).values(row as typeof workflows.$inferInsert);
  }
  return wfId;
}

export async function listWorkflows(owner: string, limit = 10, offset = 0) {
  const items = await db
    .select()
    .from(workflows)
    .where(eq(workflows.owner, owner))
    .orderBy(desc(workflows.updatedAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: count() })
    .from(workflows)
    .where(eq(workflows.owner, owner));

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function getWorkflow(id: string, owner: string) {
  return db
    .select()
    .from(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.owner, owner)));
}

export async function createRun({
  workflowId,
  owner,
  input,
}: {
  workflowId: string;
  owner: string;
  input: unknown;
}) {
  const id = generateId();
  await db
    .insert(workflowRuns)
    .values({ id, workflowId, owner, status: "queued", input: input as object });
  return id;
}

export async function updateRunStatus({
  id,
  status,
  output,
  error,
  startedAt,
  endedAt,
}: {
  id: string;
  status?: "queued" | "running" | "completed" | "failed" | "cancelled";
  output?: unknown;
  error?: unknown;
  startedAt?: Date;
  endedAt?: Date;
}) {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (status) patch.status = status;
  if (output !== undefined) patch.output = output;
  if (error !== undefined) patch.error = error;
  if (startedAt) patch.startedAt = startedAt;
  if (endedAt) patch.endedAt = endedAt;
  await db.update(workflowRuns).set(patch).where(eq(workflowRuns.id, id));
}

export async function getRun(id: string, owner: string) {
  const runs = await db
    .select()
    .from(workflowRuns)
    .where(and(eq(workflowRuns.id, id), eq(workflowRuns.owner, owner)));
  if (runs.length === 0) return null;
  const steps = await db
    .select()
    .from(workflowRunSteps)
    .where(eq(workflowRunSteps.runId, id))
    .orderBy(asc(workflowRunSteps.startedAt));
  return { run: runs[0], steps };
}

export async function upsertRunSteps(
  runId: string,
  steps: Array<{
    id: string;
    stepId: string;
    name: string;
    type: string;
    status?: "queued" | "running" | "completed" | "failed" | "skipped";
    attempt?: number;
    maxAttempts?: number;
    input?: unknown;
    output?: unknown;
    error?: unknown;
    deps?: string[];
    logs?: string;
    startedAt?: Date | null;
    endedAt?: Date | null;
  }>
) {
  if (steps.length === 0) return;
  const ids = steps.map((s) => s.id);
  const existing = await db
    .select({ id: workflowRunSteps.id })
    .from(workflowRunSteps)
    .where(inArray(workflowRunSteps.id, ids));
  const existingIds = new Set(existing.map((e) => e.id));

  const inserts = steps
    .filter((s) => !existingIds.has(s.id))
    .map((s) => ({ ...s, runId }));
  const updates = steps.filter((s) => existingIds.has(s.id));

  if (inserts.length > 0)
    await db.insert(workflowRunSteps).values(inserts as typeof workflowRunSteps.$inferInsert[]);
  for (const u of updates) {
    await db
      .update(workflowRunSteps)
      .set({ ...u } as Partial<typeof workflowRunSteps.$inferInsert>)
      .where(eq(workflowRunSteps.id, u.id));
  }
}

export async function createAIWorkflow({
  id,
  owner,
  name,
  description,
  inputSchema,
  outputSchema,
  envVars,
  definition,
}: {
  id?: string;
  owner: string;
  name: string;
  description?: string | null;
  inputSchema?: unknown;
  outputSchema?: unknown;
  envVars?: unknown;
  definition: object;
}) {
  const wfId = id ?? generateId();
  const row = {
    id: wfId,
    owner,
    name,
    description: description ?? null,
    definitionVersion: 1,
    definition,
    executionEnv: "db",
    inputSchema: inputSchema ?? null,
    outputSchema: outputSchema ?? null,
    envVars: envVars ?? null,
    updatedAt: new Date(),
  } as Record<string, unknown>;

  const existing = await db
    .select({ id: workflows.id })
    .from(workflows)
    .where(eq(workflows.id, wfId))
    .limit(1);
  if (existing.length > 0) {
    await db.update(workflows).set(row).where(eq(workflows.id, wfId));
  } else {
    (row as Record<string, unknown>).createdAt = new Date();
    await db.insert(workflows).values(row as typeof workflows.$inferInsert);
  }
  return wfId;
}

export async function getUserWorkflows(userId: string, executionEnv?: string) {
  const conditions = [eq(workflows.owner, userId)];
  if (executionEnv) {
    conditions.push(eq(workflows.executionEnv, executionEnv));
  }
  return db
    .select()
    .from(workflows)
    .where(and(...conditions))
    .orderBy(desc(workflows.updatedAt));
}

export async function getWorkflowWithSteps(workflowId: string, owner: string) {
  const workflowRows = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.id, workflowId), eq(workflows.owner, owner)));

  if (workflowRows.length === 0) return null;

  return workflowRows[0];
}

export async function createWorkflowRun({
  workflowId,
  owner,
  input,
}: {
  workflowId: string;
  owner: string;
  input: unknown;
}) {
  const id = generateId();
  await db.insert(workflowRuns).values({
    id,
    workflowId,
    owner,
    status: "queued",
    input: input as object,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function updateStepExecution({
  runId,
  stepId,
  output,
  status,
  error,
  startedAt,
  endedAt,
}: {
  runId: string;
  stepId: string;
  output?: unknown;
  status?: "queued" | "running" | "completed" | "failed" | "skipped";
  error?: unknown;
  startedAt?: Date | null;
  endedAt?: Date | null;
}) {
  const patch: Record<string, unknown> = {};
  if (output !== undefined) patch.output = output;
  if (status) patch.status = status;
  if (error !== undefined) patch.error = error;
  if (startedAt !== undefined) patch.startedAt = startedAt;
  if (endedAt !== undefined) patch.endedAt = endedAt;

  await db
    .update(workflowRunSteps)
    .set(patch)
    .where(
      and(
        eq(workflowRunSteps.runId, runId),
        eq(workflowRunSteps.stepId, stepId)
      )
    );
}

export async function getRunStatus(runId: string, owner: string) {
  const runs = await db
    .select()
    .from(workflowRuns)
    .where(and(eq(workflowRuns.id, runId), eq(workflowRuns.owner, owner)));

  if (runs.length === 0) return null;

  const steps = await db
    .select()
    .from(workflowRunSteps)
    .where(eq(workflowRunSteps.runId, runId))
    .orderBy(asc(workflowRunSteps.startedAt));

  return { run: runs[0], steps };
}

export async function listWorkflowRuns(owner: string, limit = 10, offset = 0) {
  const items = await db
    .select({
      id: workflowRuns.id,
      workflowId: workflowRuns.workflowId,
      status: workflowRuns.status,
      input: workflowRuns.input,
      output: workflowRuns.output,
      error: workflowRuns.error,
      createdAt: workflowRuns.createdAt,
      updatedAt: workflowRuns.updatedAt,
      startedAt: workflowRuns.startedAt,
      endedAt: workflowRuns.endedAt,
      workflowName: workflows.name,
    })
    .from(workflowRuns)
    .leftJoin(workflows, eq(workflowRuns.workflowId, workflows.id))
    .where(eq(workflowRuns.owner, owner))
    .orderBy(desc(workflowRuns.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: count() })
    .from(workflowRuns)
    .where(eq(workflowRuns.owner, owner));

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function createOrUpdateStepExecution({
  runId,
  stepId,
  name,
  type,
  output,
  status,
  error,
  startedAt,
  endedAt,
}: {
  runId: string;
  stepId: string;
  name: string;
  type: string;
  output?: unknown;
  status?: "queued" | "running" | "completed" | "failed" | "skipped";
  error?: unknown;
  startedAt?: Date | null;
  endedAt?: Date | null;
}) {
  const existing = await db
    .select({ id: workflowRunSteps.id })
    .from(workflowRunSteps)
    .where(
      and(
        eq(workflowRunSteps.runId, runId),
        eq(workflowRunSteps.stepId, stepId)
      )
    )
    .limit(1);

  const patch: Record<string, unknown> = { runId, stepId, name, type };
  if (output !== undefined) patch.output = output;
  if (status) patch.status = status;
  if (error !== undefined) patch.error = error;
  if (startedAt !== undefined) patch.startedAt = startedAt;
  if (endedAt !== undefined) patch.endedAt = endedAt;

  if (existing.length === 0) {
    (patch as Record<string, unknown>).id = `${runId}_${stepId}`;
    (patch as Record<string, unknown>).attempt = 0;
    (patch as Record<string, unknown>).maxAttempts = 1;
    (patch as Record<string, unknown>).deps = [];
    await db.insert(workflowRunSteps).values(patch as typeof workflowRunSteps.$inferInsert);
  } else {
    await db
      .update(workflowRunSteps)
      .set(patch)
      .where(
        and(
          eq(workflowRunSteps.runId, runId),
          eq(workflowRunSteps.stepId, stepId)
        )
      );
  }
}

// ============================================================
// VERSIONING FUNCTIONS
// ============================================================

// Create a workflow version snapshot
export async function createWorkflowVersion({
  workflowId,
  version,
  snapshot,
  changedBy,
  changeType,
  changeMessage,
}: {
  workflowId: string;
  version: number;
  snapshot: {
    name: string;
    description?: string | null;
    definition: object;
    inputSchema?: unknown;
    outputSchema?: unknown;
    envVars?: unknown;
    executionEnv?: string;
  };
  changedBy: string;
  changeType: "create" | "update" | "restore";
  changeMessage?: string;
}) {
  const id = generateId();
  await db.insert(workflowVersions).values({
    id,
    workflowId,
    version,
    name: snapshot.name,
    description: snapshot.description ?? null,
    definition: snapshot.definition,
    inputSchema: (snapshot.inputSchema as object) ?? null,
    outputSchema: (snapshot.outputSchema as object) ?? null,
    envVars: (snapshot.envVars as object) ?? null,
    executionEnv: snapshot.executionEnv ?? "db",
    changedBy,
    changeType,
    changeMessage: changeMessage ?? null,
    createdAt: new Date(),
  });
  return id;
}

// Get all versions for a workflow
export async function getWorkflowVersions(workflowId: string, owner: string) {
  // First verify ownership
  const workflow = await db
    .select({ id: workflows.id })
    .from(workflows)
    .where(and(eq(workflows.id, workflowId), eq(workflows.owner, owner)))
    .limit(1);

  if (workflow.length === 0) return null;

  return db
    .select()
    .from(workflowVersions)
    .where(eq(workflowVersions.workflowId, workflowId))
    .orderBy(desc(workflowVersions.version));
}

// Get a specific workflow version
export async function getWorkflowVersion(
  workflowId: string,
  version: number,
  owner: string
) {
  // Verify ownership
  const workflow = await db
    .select({ id: workflows.id })
    .from(workflows)
    .where(and(eq(workflows.id, workflowId), eq(workflows.owner, owner)))
    .limit(1);

  if (workflow.length === 0) return null;

  const versions = await db
    .select()
    .from(workflowVersions)
    .where(
      and(
        eq(workflowVersions.workflowId, workflowId),
        eq(workflowVersions.version, version)
      )
    )
    .limit(1);

  return versions[0] ?? null;
}

// Compare two workflow versions
export async function compareWorkflowVersions(
  workflowId: string,
  versionA: number,
  versionB: number,
  owner: string
) {
  const [a, b] = await Promise.all([
    getWorkflowVersion(workflowId, versionA, owner),
    getWorkflowVersion(workflowId, versionB, owner),
  ]);
  return { versionA: a, versionB: b };
}

// Helper to normalize workflow definition for comparison
// Strips out layout-only fields (x, y positions) that shouldn't trigger new versions
function normalizeDefinitionForComparison(definition: unknown): string {
  if (!definition || typeof definition !== "object") return JSON.stringify(definition);

  const def = definition as { nodes?: unknown[]; edges?: unknown[] };
  const normalized = {
    nodes: (def.nodes || []).map((node: unknown) => {
      if (!node || typeof node !== "object") return node;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { x, y, ...rest } = node as Record<string, unknown>;
      return rest;
    }),
    edges: def.edges || [],
  };

  // Sort keys for consistent comparison
  return JSON.stringify(normalized, Object.keys(normalized).sort());
}

// Helper to check if workflow content has changed
function hasWorkflowContentChanged(
  existing: {
    name: string;
    description: string | null;
    definition: unknown;
    inputSchema: unknown;
    outputSchema: unknown;
    envVars: unknown;
    executionEnv: string;
  },
  updated: {
    name: string;
    description?: string | null;
    definition: object;
    inputSchema?: unknown;
    outputSchema?: unknown;
    envVars?: unknown;
    executionEnv: string;
  }
): boolean {
  if (existing.name !== updated.name) return true;
  if ((existing.description ?? null) !== (updated.description ?? null)) return true;
  if (existing.executionEnv !== updated.executionEnv) return true;
  // Compare definitions without layout fields (x, y positions)
  if (normalizeDefinitionForComparison(existing.definition) !== normalizeDefinitionForComparison(updated.definition)) return true;
  if (JSON.stringify(existing.inputSchema ?? null) !== JSON.stringify(updated.inputSchema ?? null)) return true;
  if (JSON.stringify(existing.outputSchema ?? null) !== JSON.stringify(updated.outputSchema ?? null)) return true;
  if (JSON.stringify(existing.envVars ?? null) !== JSON.stringify(updated.envVars ?? null)) return true;
  return false;
}

// Create or update workflow with versioning
// Only creates a new version when content actually changes
export async function createOrUpdateWorkflowWithVersioning({
  id,
  owner,
  name,
  description,
  definition,
  inputSchema,
  outputSchema,
  envVars,
  executionEnv,
  changeMessage,
}: {
  id?: string;
  owner: string;
  name: string;
  description?: string | null;
  definition: object;
  inputSchema?: unknown;
  outputSchema?: unknown;
  envVars?: unknown;
  executionEnv?: string;
  changeMessage?: string;
}) {
  const wfId = id ?? generateId();
  const env = executionEnv ?? "db";

  // Check if workflow exists and get full data for comparison
  const existing = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, wfId))
    .limit(1);

  const isUpdate = existing.length > 0;

  // For updates, check if content actually changed
  if (isUpdate) {
    const current = existing[0];
    const hasChanges = hasWorkflowContentChanged(
      {
        name: current.name,
        description: current.description,
        definition: current.definition,
        inputSchema: current.inputSchema,
        outputSchema: current.outputSchema,
        envVars: current.envVars,
        executionEnv: current.executionEnv,
      },
      { name, description, definition, inputSchema, outputSchema, envVars, executionEnv: env }
    );

    // No changes - return existing version without creating new snapshot
    if (!hasChanges) {
      return { id: wfId, version: current.definitionVersion };
    }
  }

  const newVersion = isUpdate ? existing[0].definitionVersion + 1 : 1;

  // Create version snapshot (only when there are actual changes)
  await createWorkflowVersion({
    workflowId: wfId,
    version: newVersion,
    snapshot: {
      name,
      description,
      definition,
      inputSchema,
      outputSchema,
      envVars,
      executionEnv: env,
    },
    changedBy: owner,
    changeType: isUpdate ? "update" : "create",
    changeMessage,
  });

  // Update main workflow record
  const row = {
    id: wfId,
    owner,
    name,
    description: description ?? null,
    definitionVersion: newVersion,
    definition,
    executionEnv: env,
    inputSchema: (inputSchema as object) ?? null,
    outputSchema: (outputSchema as object) ?? null,
    envVars: (envVars as object) ?? null,
    updatedAt: new Date(),
  } as Record<string, unknown>;

  if (isUpdate) {
    await db.update(workflows).set(row).where(eq(workflows.id, wfId));
  } else {
    (row as Record<string, unknown>).createdAt = new Date();
    await db.insert(workflows).values(row as typeof workflows.$inferInsert);
  }

  return { id: wfId, version: newVersion };
}

// Restore a workflow to a previous version
export async function restoreWorkflowVersion(
  workflowId: string,
  targetVersion: number,
  owner: string,
  changeMessage?: string
) {
  // Get the target version
  const target = await getWorkflowVersion(workflowId, targetVersion, owner);
  if (!target) return null;

  // Get current version number
  const current = await db
    .select({ version: workflows.definitionVersion })
    .from(workflows)
    .where(eq(workflows.id, workflowId))
    .limit(1);

  if (current.length === 0) return null;

  const newVersion = current[0].version + 1;

  // Create new version from restore
  await createWorkflowVersion({
    workflowId,
    version: newVersion,
    snapshot: {
      name: target.name,
      description: target.description,
      definition: target.definition as object,
      inputSchema: target.inputSchema,
      outputSchema: target.outputSchema,
      envVars: target.envVars,
      executionEnv: target.executionEnv,
    },
    changedBy: owner,
    changeType: "restore",
    changeMessage: changeMessage ?? `Restored from version ${targetVersion}`,
  });

  // Update main workflow
  await db
    .update(workflows)
    .set({
      name: target.name,
      description: target.description,
      definition: target.definition,
      inputSchema: target.inputSchema,
      outputSchema: target.outputSchema,
      envVars: target.envVars,
      executionEnv: target.executionEnv,
      definitionVersion: newVersion,
      updatedAt: new Date(),
    })
    .where(eq(workflows.id, workflowId));

  return { id: workflowId, version: newVersion };
}

// ============================================================
// TOOL VERSIONING FUNCTIONS
// ============================================================

// Create a tool version snapshot
export async function createToolVersion({
  toolId,
  version,
  snapshot,
  changedBy,
  changeType,
  changeMessage,
}: {
  toolId: string;
  version: number;
  snapshot: {
    name: string;
    description?: string | null;
    type: string;
    inputSchema: object;
    outputSchema?: unknown;
    implementation?: string | null;
    lambdaArn?: string | null;
    executionEnv?: string;
  };
  changedBy: string;
  changeType: "create" | "update" | "restore";
  changeMessage?: string;
}) {
  const id = generateId();
  await db.insert(toolVersions).values({
    id,
    toolId,
    version,
    name: snapshot.name,
    description: snapshot.description ?? null,
    type: snapshot.type,
    inputSchema: snapshot.inputSchema,
    outputSchema: (snapshot.outputSchema as object) ?? null,
    implementation: snapshot.implementation ?? null,
    lambdaArn: snapshot.lambdaArn ?? null,
    executionEnv: snapshot.executionEnv ?? "db",
    changedBy,
    changeType,
    changeMessage: changeMessage ?? null,
    createdAt: new Date(),
  });
  return id;
}

// Get all versions for a tool
export async function getToolVersions(toolId: string, owner: string) {
  const tool = await db
    .select({ id: tools.id })
    .from(tools)
    .where(and(eq(tools.id, toolId), eq(tools.owner, owner)))
    .limit(1);

  if (tool.length === 0) return null;

  return db
    .select()
    .from(toolVersions)
    .where(eq(toolVersions.toolId, toolId))
    .orderBy(desc(toolVersions.version));
}

// Get a specific tool version
export async function getToolVersion(
  toolId: string,
  version: number,
  owner: string
) {
  const tool = await db
    .select({ id: tools.id })
    .from(tools)
    .where(and(eq(tools.id, toolId), eq(tools.owner, owner)))
    .limit(1);

  if (tool.length === 0) return null;

  const versions = await db
    .select()
    .from(toolVersions)
    .where(
      and(eq(toolVersions.toolId, toolId), eq(toolVersions.version, version))
    )
    .limit(1);

  return versions[0] ?? null;
}

// Compare two tool versions
export async function compareToolVersions(
  toolId: string,
  versionA: number,
  versionB: number,
  owner: string
) {
  const [a, b] = await Promise.all([
    getToolVersion(toolId, versionA, owner),
    getToolVersion(toolId, versionB, owner),
  ]);
  return { versionA: a, versionB: b };
}

// Helper to check if tool content has changed
function hasToolContentChanged(
  existing: {
    name: string;
    description: string | null;
    type: string;
    inputSchema: unknown;
    outputSchema: unknown;
    implementation: string | null;
    lambdaArn: string | null;
    executionEnv: string;
  },
  updated: {
    name: string;
    description?: string | null;
    type: string;
    inputSchema: object;
    outputSchema?: unknown;
    implementation?: string | null;
    lambdaArn?: string | null;
    executionEnv: string;
  }
): boolean {
  if (existing.name !== updated.name) return true;
  if ((existing.description ?? null) !== (updated.description ?? null)) return true;
  if (existing.type !== updated.type) return true;
  if (existing.executionEnv !== updated.executionEnv) return true;
  if ((existing.implementation ?? null) !== (updated.implementation ?? null)) return true;
  if ((existing.lambdaArn ?? null) !== (updated.lambdaArn ?? null)) return true;
  if (JSON.stringify(existing.inputSchema) !== JSON.stringify(updated.inputSchema)) return true;
  if (JSON.stringify(existing.outputSchema ?? null) !== JSON.stringify(updated.outputSchema ?? null)) return true;
  return false;
}

// Create or update tool with versioning
// Only creates a new version when content actually changes
export async function createOrUpdateToolWithVersioning({
  id,
  owner,
  name,
  description,
  type,
  inputSchema,
  outputSchema,
  implementation,
  lambdaArn,
  executionEnv,
  changeMessage,
}: {
  id?: string;
  owner: string;
  name: string;
  description?: string | null;
  type: string;
  inputSchema: object;
  outputSchema?: unknown;
  implementation?: string | null;
  lambdaArn?: string | null;
  executionEnv?: string;
  changeMessage?: string;
}) {
  const toolId = id ?? generateId();
  const env = executionEnv ?? "db";

  // Check if tool exists and get full data for comparison
  const existing = await db
    .select()
    .from(tools)
    .where(eq(tools.id, toolId))
    .limit(1);

  const isUpdate = existing.length > 0;

  // For updates, check if content actually changed
  if (isUpdate) {
    const current = existing[0];
    const hasChanges = hasToolContentChanged(
      {
        name: current.name,
        description: current.description,
        type: current.type,
        inputSchema: current.inputSchema,
        outputSchema: current.outputSchema,
        implementation: current.implementation,
        lambdaArn: current.lambdaArn,
        executionEnv: current.executionEnv,
      },
      { name, description, type, inputSchema, outputSchema, implementation, lambdaArn, executionEnv: env }
    );

    // No changes - return existing version without creating new snapshot
    if (!hasChanges) {
      return { id: toolId, version: current.currentVersion ?? 1 };
    }
  }

  const newVersion = isUpdate ? (existing[0].currentVersion ?? 1) + 1 : 1;

  // Create version snapshot (only when there are actual changes)
  await createToolVersion({
    toolId,
    version: newVersion,
    snapshot: {
      name,
      description,
      type,
      inputSchema,
      outputSchema,
      implementation,
      lambdaArn,
      executionEnv: env,
    },
    changedBy: owner,
    changeType: isUpdate ? "update" : "create",
    changeMessage,
  });

  // Update main tool record
  const row = {
    id: toolId,
    owner,
    name,
    description: description ?? null,
    type,
    inputSchema,
    outputSchema: (outputSchema as object) ?? null,
    implementation: implementation ?? null,
    lambdaArn: lambdaArn ?? null,
    executionEnv: env,
    currentVersion: newVersion,
    updatedAt: new Date(),
  } as Record<string, unknown>;

  if (isUpdate) {
    await db.update(tools).set(row).where(eq(tools.id, toolId));
  } else {
    (row as Record<string, unknown>).createdAt = new Date();
    await db.insert(tools).values(row as typeof tools.$inferInsert);
  }

  return { id: toolId, version: newVersion };
}

// Restore a tool to a previous version
export async function restoreToolVersion(
  toolId: string,
  targetVersion: number,
  owner: string,
  changeMessage?: string
) {
  const target = await getToolVersion(toolId, targetVersion, owner);
  if (!target) return null;

  const current = await db
    .select({ version: tools.currentVersion })
    .from(tools)
    .where(eq(tools.id, toolId))
    .limit(1);

  if (current.length === 0) return null;

  const newVersion = (current[0].version ?? 1) + 1;

  await createToolVersion({
    toolId,
    version: newVersion,
    snapshot: {
      name: target.name,
      description: target.description,
      type: target.type,
      inputSchema: target.inputSchema as object,
      outputSchema: target.outputSchema,
      implementation: target.implementation,
      lambdaArn: target.lambdaArn,
      executionEnv: target.executionEnv,
    },
    changedBy: owner,
    changeType: "restore",
    changeMessage: changeMessage ?? `Restored from version ${targetVersion}`,
  });

  await db
    .update(tools)
    .set({
      name: target.name,
      description: target.description,
      type: target.type,
      inputSchema: target.inputSchema,
      outputSchema: target.outputSchema,
      implementation: target.implementation,
      lambdaArn: target.lambdaArn,
      executionEnv: target.executionEnv,
      currentVersion: newVersion,
      updatedAt: new Date(),
    })
    .where(eq(tools.id, toolId));

  return { id: toolId, version: newVersion };
}

// Create workflow run with version tracking
export async function createWorkflowRunWithVersion({
  workflowId,
  owner,
  input,
}: {
  workflowId: string;
  owner: string;
  input: unknown;
}) {
  // Get current workflow version
  const workflow = await db
    .select({ version: workflows.definitionVersion })
    .from(workflows)
    .where(eq(workflows.id, workflowId))
    .limit(1);

  const id = generateId();
  await db.insert(workflowRuns).values({
    id,
    workflowId,
    owner,
    status: "queued",
    workflowVersion: workflow[0]?.version ?? 1,
    input: input as object,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}
