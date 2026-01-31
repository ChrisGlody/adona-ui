import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNextExecutableSteps,
  isWorkflowComplete,
  type WorkflowDefinition,
  type CompletedStep,
} from "@/lib/workflows/graph-analyzer";

/**
 * Integration tests for complete workflow execution scenarios.
 * These tests simulate end-to-end workflow execution without mocking
 * the graph analyzer, testing realistic workflow patterns.
 */
describe("Workflow Execution Integration", () => {
  describe("linear workflow execution", () => {
    const linearWorkflow: WorkflowDefinition = {
      nodes: [
        { id: "fetch-data", name: "Fetch Data", type: "inline" },
        { id: "process-data", name: "Process Data", type: "inline", code: "fn main(i){return i;}" },
        { id: "save-result", name: "Save Result", type: "inline" },
      ],
      edges: [
        { id: "e1", source: "fetch-data", target: "process-data" },
        { id: "e2", source: "process-data", target: "save-result" },
      ],
    };

    it("should execute steps in order", () => {
      const completedSteps: CompletedStep[] = [];
      const stepOutputs: Record<string, unknown> = {};

      // Step 1: Only fetch-data is executable
      let nextSteps = getNextExecutableSteps(linearWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId)).toEqual(["fetch-data"]);
      expect(isWorkflowComplete(linearWorkflow, completedSteps)).toBe(false);

      // Complete fetch-data
      completedSteps.push({ stepId: "fetch-data", output: { data: [1, 2, 3] } });
      stepOutputs["fetch-data"] = { data: [1, 2, 3] };

      // Step 2: Only process-data is executable
      nextSteps = getNextExecutableSteps(linearWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId)).toEqual(["process-data"]);
      expect(isWorkflowComplete(linearWorkflow, completedSteps)).toBe(false);

      // Complete process-data
      completedSteps.push({ stepId: "process-data", output: { processed: true } });
      stepOutputs["process-data"] = { processed: true };

      // Step 3: Only save-result is executable
      nextSteps = getNextExecutableSteps(linearWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId)).toEqual(["save-result"]);
      expect(isWorkflowComplete(linearWorkflow, completedSteps)).toBe(false);

      // Complete save-result
      completedSteps.push({ stepId: "save-result", output: { saved: true } });

      // Workflow complete
      nextSteps = getNextExecutableSteps(linearWorkflow, completedSteps, stepOutputs);
      expect(nextSteps).toEqual([]);
      expect(isWorkflowComplete(linearWorkflow, completedSteps)).toBe(true);
    });
  });

  describe("parallel workflow execution", () => {
    const parallelWorkflow: WorkflowDefinition = {
      nodes: [
        { id: "start", name: "Start", type: "inline" },
        { id: "branch-a", name: "Branch A", type: "inline" },
        { id: "branch-b", name: "Branch B", type: "inline" },
        { id: "branch-c", name: "Branch C", type: "inline" },
        { id: "merge", name: "Merge Results", type: "inline" },
      ],
      edges: [
        { id: "e1", source: "start", target: "branch-a" },
        { id: "e2", source: "start", target: "branch-b" },
        { id: "e3", source: "start", target: "branch-c" },
        { id: "e4", source: "branch-a", target: "merge" },
        { id: "e5", source: "branch-b", target: "merge" },
        { id: "e6", source: "branch-c", target: "merge" },
      ],
    };

    it("should execute parallel branches simultaneously", () => {
      const completedSteps: CompletedStep[] = [];
      const stepOutputs: Record<string, unknown> = {};

      // Step 1: Only start is executable
      let nextSteps = getNextExecutableSteps(parallelWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId)).toEqual(["start"]);

      // Complete start
      completedSteps.push({ stepId: "start", output: {} });

      // Step 2: All three branches are executable in parallel
      nextSteps = getNextExecutableSteps(parallelWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId).sort()).toEqual(["branch-a", "branch-b", "branch-c"]);

      // Complete two branches - merge still not ready
      completedSteps.push({ stepId: "branch-a", output: { a: 1 } });
      completedSteps.push({ stepId: "branch-b", output: { b: 2 } });
      stepOutputs["branch-a"] = { a: 1 };
      stepOutputs["branch-b"] = { b: 2 };

      nextSteps = getNextExecutableSteps(parallelWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId)).toEqual(["branch-c"]);

      // Complete last branch - now merge is ready
      completedSteps.push({ stepId: "branch-c", output: { c: 3 } });
      stepOutputs["branch-c"] = { c: 3 };

      nextSteps = getNextExecutableSteps(parallelWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId)).toEqual(["merge"]);

      // Complete merge
      completedSteps.push({ stepId: "merge", output: { merged: true } });

      expect(isWorkflowComplete(parallelWorkflow, completedSteps)).toBe(true);
    });
  });

  describe("conditional workflow execution", () => {
    // Note: The graph analyzer treats all incoming edges as dependencies.
    // For exclusive conditional paths, use separate end nodes or design the
    // workflow so the end node doesn't depend on mutually exclusive paths.
    const conditionalWorkflow: WorkflowDefinition = {
      nodes: [
        { id: "check-input", name: "Check Input", type: "inline" },
        { id: "success-path", name: "Success Path", type: "inline" },
        { id: "failure-path", name: "Failure Path", type: "inline" },
      ],
      edges: [
        {
          id: "e1",
          source: "check-input",
          target: "success-path",
          condition: "context.stepOutputs['check-input'].valid === true",
        },
        {
          id: "e2",
          source: "check-input",
          target: "failure-path",
          condition: "context.stepOutputs['check-input'].valid === false",
        },
      ],
    };

    it("should follow success path when condition is true", () => {
      const completedSteps: CompletedStep[] = [];
      const stepOutputs: Record<string, unknown> = {};

      // Start: only check-input is executable
      let nextSteps = getNextExecutableSteps(conditionalWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId)).toEqual(["check-input"]);

      // Complete check-input with valid=true
      completedSteps.push({ stepId: "check-input", output: { valid: true } });
      stepOutputs["check-input"] = { valid: true };

      // Only success-path should be executable (not failure-path)
      nextSteps = getNextExecutableSteps(conditionalWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId)).toEqual(["success-path"]);

      // Complete success-path - workflow is done
      completedSteps.push({ stepId: "success-path", output: { result: "success" } });
      stepOutputs["success-path"] = { result: "success" };

      // No more steps (failure-path condition is false)
      nextSteps = getNextExecutableSteps(conditionalWorkflow, completedSteps, stepOutputs);
      expect(nextSteps).toEqual([]);
    });

    it("should follow failure path when condition is false", () => {
      const completedSteps: CompletedStep[] = [];
      const stepOutputs: Record<string, unknown> = {};

      // Complete check-input with valid=false
      completedSteps.push({ stepId: "check-input", output: { valid: false } });
      stepOutputs["check-input"] = { valid: false };

      // Only failure-path should be executable (not success-path)
      const nextSteps = getNextExecutableSteps(
        conditionalWorkflow,
        completedSteps,
        stepOutputs
      );
      expect(nextSteps.map((s) => s.stepId)).toEqual(["failure-path"]);
    });
  });

  describe("complex DAG workflow", () => {
    //       start
    //      /  |  \
    //     A   B   C
    //     |   |   |
    //     |   +---+
    //     |     |
    //     D     E
    //      \   /
    //       end
    const complexWorkflow: WorkflowDefinition = {
      nodes: [
        { id: "start", name: "Start", type: "inline" },
        { id: "A", name: "Task A", type: "inline" },
        { id: "B", name: "Task B", type: "inline" },
        { id: "C", name: "Task C", type: "inline" },
        { id: "D", name: "Task D", type: "inline" },
        { id: "E", name: "Task E", type: "inline" },
        { id: "end", name: "End", type: "inline" },
      ],
      edges: [
        { id: "e1", source: "start", target: "A" },
        { id: "e2", source: "start", target: "B" },
        { id: "e3", source: "start", target: "C" },
        { id: "e4", source: "A", target: "D" },
        { id: "e5", source: "B", target: "E" },
        { id: "e6", source: "C", target: "E" },
        { id: "e7", source: "D", target: "end" },
        { id: "e8", source: "E", target: "end" },
      ],
    };

    it("should correctly track dependencies in complex DAG", () => {
      const completedSteps: CompletedStep[] = [];
      const stepOutputs: Record<string, unknown> = {};

      // Initially only start
      let nextSteps = getNextExecutableSteps(complexWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId)).toEqual(["start"]);

      // After start: A, B, C are parallel
      completedSteps.push({ stepId: "start", output: {} });
      nextSteps = getNextExecutableSteps(complexWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId).sort()).toEqual(["A", "B", "C"]);

      // After A: D is ready, but E still needs B and C
      completedSteps.push({ stepId: "A", output: {} });
      nextSteps = getNextExecutableSteps(complexWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId).sort()).toEqual(["B", "C", "D"]);

      // After A, B, D: E still needs C, end needs E
      completedSteps.push({ stepId: "B", output: {} });
      completedSteps.push({ stepId: "D", output: {} });
      nextSteps = getNextExecutableSteps(complexWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId)).toEqual(["C"]);

      // After A, B, C, D: E is ready
      completedSteps.push({ stepId: "C", output: {} });
      nextSteps = getNextExecutableSteps(complexWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId)).toEqual(["E"]);

      // After all except end: end is ready
      completedSteps.push({ stepId: "E", output: {} });
      nextSteps = getNextExecutableSteps(complexWorkflow, completedSteps, stepOutputs);
      expect(nextSteps.map((s) => s.stepId)).toEqual(["end"]);

      // Complete
      completedSteps.push({ stepId: "end", output: {} });
      expect(isWorkflowComplete(complexWorkflow, completedSteps)).toBe(true);
    });
  });

  describe("workflow with input propagation", () => {
    const dataPipelineWorkflow: WorkflowDefinition = {
      nodes: [
        { id: "extract", name: "Extract", type: "inline" },
        { id: "transform", name: "Transform", type: "inline" },
        { id: "load", name: "Load", type: "inline" },
      ],
      edges: [
        { id: "e1", source: "extract", target: "transform" },
        { id: "e2", source: "transform", target: "load" },
      ],
    };

    it("should track step outputs throughout execution", () => {
      const completedSteps: CompletedStep[] = [];
      const stepOutputs: Record<string, unknown> = {};
      const workflowInput = { source: "database", table: "users" };

      // Simulate full execution with data propagation
      completedSteps.push({
        stepId: "extract",
        output: { records: [{ id: 1 }, { id: 2 }] },
      });
      stepOutputs["extract"] = { records: [{ id: 1 }, { id: 2 }] };

      let nextSteps = getNextExecutableSteps(
        dataPipelineWorkflow,
        completedSteps,
        stepOutputs,
        workflowInput
      );
      expect(nextSteps[0].stepId).toBe("transform");

      completedSteps.push({
        stepId: "transform",
        output: { transformedRecords: [{ id: 1, processed: true }] },
      });
      stepOutputs["transform"] = { transformedRecords: [{ id: 1, processed: true }] };

      nextSteps = getNextExecutableSteps(
        dataPipelineWorkflow,
        completedSteps,
        stepOutputs,
        workflowInput
      );
      expect(nextSteps[0].stepId).toBe("load");

      // Verify all outputs are preserved
      expect(stepOutputs).toEqual({
        extract: { records: [{ id: 1 }, { id: 2 }] },
        transform: { transformedRecords: [{ id: 1, processed: true }] },
      });
    });
  });

  describe("edge cases", () => {
    it("should handle single-node workflow", () => {
      const singleNodeWorkflow: WorkflowDefinition = {
        nodes: [{ id: "only-step", name: "Only Step", type: "inline" }],
        edges: [],
      };

      let nextSteps = getNextExecutableSteps(singleNodeWorkflow, [], {});
      expect(nextSteps.map((s) => s.stepId)).toEqual(["only-step"]);

      const completedSteps = [{ stepId: "only-step", output: {} }];
      expect(isWorkflowComplete(singleNodeWorkflow, completedSteps)).toBe(true);
    });

    it("should handle workflow with no edges (all parallel)", () => {
      const allParallelWorkflow: WorkflowDefinition = {
        nodes: [
          { id: "task-1", name: "Task 1", type: "inline" },
          { id: "task-2", name: "Task 2", type: "inline" },
          { id: "task-3", name: "Task 3", type: "inline" },
        ],
        edges: [],
      };

      const nextSteps = getNextExecutableSteps(allParallelWorkflow, [], {});
      expect(nextSteps.map((s) => s.stepId).sort()).toEqual([
        "task-1",
        "task-2",
        "task-3",
      ]);
    });

    it("should handle workflow with self-referencing condition", () => {
      const conditionalWorkflow: WorkflowDefinition = {
        nodes: [
          { id: "step-1", name: "Step 1", type: "inline" },
          { id: "step-2", name: "Step 2", type: "inline" },
        ],
        edges: [
          {
            id: "e1",
            source: "step-1",
            target: "step-2",
            condition: "context.workflowInput.proceed === true",
          },
        ],
      };

      // With proceed=true
      let nextSteps = getNextExecutableSteps(
        conditionalWorkflow,
        [{ stepId: "step-1", output: {} }],
        {},
        { proceed: true }
      );
      expect(nextSteps.map((s) => s.stepId)).toEqual(["step-2"]);

      // With proceed=false
      nextSteps = getNextExecutableSteps(
        conditionalWorkflow,
        [{ stepId: "step-1", output: {} }],
        {},
        { proceed: false }
      );
      expect(nextSteps).toEqual([]);
    });
  });
});
