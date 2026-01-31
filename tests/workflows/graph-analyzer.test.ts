import { describe, it, expect } from "vitest";
import {
  getNextExecutableSteps,
  isWorkflowComplete,
  type WorkflowDefinition,
  type CompletedStep,
} from "@/lib/workflows/graph-analyzer";

describe("graph-analyzer", () => {
  describe("getNextExecutableSteps", () => {
    it("should return all nodes with no dependencies when no steps are completed", () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          { id: "step1", name: "Step 1", type: "inline" },
          { id: "step2", name: "Step 2", type: "inline" },
        ],
        edges: [],
      };

      const result = getNextExecutableSteps(workflow, []);

      expect(result).toHaveLength(2);
      expect(result.map((s) => s.stepId)).toContain("step1");
      expect(result.map((s) => s.stepId)).toContain("step2");
    });

    it("should exclude already completed steps", () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          { id: "step1", name: "Step 1", type: "inline" },
          { id: "step2", name: "Step 2", type: "inline" },
        ],
        edges: [],
      };
      const completedSteps: CompletedStep[] = [
        { stepId: "step1", output: { result: "done" } },
      ];

      const result = getNextExecutableSteps(workflow, completedSteps);

      expect(result).toHaveLength(1);
      expect(result[0].stepId).toBe("step2");
    });

    it("should respect dependencies - not return steps with unmet dependencies", () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          { id: "step1", name: "Step 1", type: "inline" },
          { id: "step2", name: "Step 2", type: "inline" },
          { id: "step3", name: "Step 3", type: "inline" },
        ],
        edges: [
          { id: "e1", source: "step1", target: "step2" },
          { id: "e2", source: "step2", target: "step3" },
        ],
      };

      const result = getNextExecutableSteps(workflow, []);

      expect(result).toHaveLength(1);
      expect(result[0].stepId).toBe("step1");
    });

    it("should return step when all dependencies are met", () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          { id: "step1", name: "Step 1", type: "inline" },
          { id: "step2", name: "Step 2", type: "inline" },
        ],
        edges: [{ id: "e1", source: "step1", target: "step2" }],
      };
      const completedSteps: CompletedStep[] = [
        { stepId: "step1", output: { result: "done" } },
      ];

      const result = getNextExecutableSteps(workflow, completedSteps);

      expect(result).toHaveLength(1);
      expect(result[0].stepId).toBe("step2");
    });

    it("should handle multiple dependencies (fan-in)", () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          { id: "step1", name: "Step 1", type: "inline" },
          { id: "step2", name: "Step 2", type: "inline" },
          { id: "step3", name: "Step 3", type: "inline" },
        ],
        edges: [
          { id: "e1", source: "step1", target: "step3" },
          { id: "e2", source: "step2", target: "step3" },
        ],
      };

      // Only step1 completed - step3 should not be executable
      const partialComplete: CompletedStep[] = [
        { stepId: "step1", output: {} },
      ];
      let result = getNextExecutableSteps(workflow, partialComplete);
      expect(result.map((s) => s.stepId)).not.toContain("step3");
      expect(result.map((s) => s.stepId)).toContain("step2");

      // Both step1 and step2 completed - step3 should be executable
      const allComplete: CompletedStep[] = [
        { stepId: "step1", output: {} },
        { stepId: "step2", output: {} },
      ];
      result = getNextExecutableSteps(workflow, allComplete);
      expect(result).toHaveLength(1);
      expect(result[0].stepId).toBe("step3");
    });

    it("should handle parallel branches (fan-out)", () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          { id: "start", name: "Start", type: "inline" },
          { id: "branch1", name: "Branch 1", type: "inline" },
          { id: "branch2", name: "Branch 2", type: "inline" },
        ],
        edges: [
          { id: "e1", source: "start", target: "branch1" },
          { id: "e2", source: "start", target: "branch2" },
        ],
      };
      const completedSteps: CompletedStep[] = [
        { stepId: "start", output: {} },
      ];

      const result = getNextExecutableSteps(workflow, completedSteps);

      expect(result).toHaveLength(2);
      expect(result.map((s) => s.stepId)).toContain("branch1");
      expect(result.map((s) => s.stepId)).toContain("branch2");
    });

    describe("conditional edges", () => {
      it("should execute step when condition evaluates to true", () => {
        const workflow: WorkflowDefinition = {
          nodes: [
            { id: "step1", name: "Step 1", type: "inline" },
            { id: "step2", name: "Step 2", type: "inline" },
          ],
          edges: [
            {
              id: "e1",
              source: "step1",
              target: "step2",
              condition: "context.stepOutputs.step1.success === true",
            },
          ],
        };
        const completedSteps: CompletedStep[] = [
          { stepId: "step1", output: { success: true } },
        ];
        const stepOutputs = { step1: { success: true } };

        const result = getNextExecutableSteps(
          workflow,
          completedSteps,
          stepOutputs
        );

        expect(result).toHaveLength(1);
        expect(result[0].stepId).toBe("step2");
      });

      it("should not execute step when condition evaluates to false", () => {
        const workflow: WorkflowDefinition = {
          nodes: [
            { id: "step1", name: "Step 1", type: "inline" },
            { id: "step2", name: "Step 2", type: "inline" },
          ],
          edges: [
            {
              id: "e1",
              source: "step1",
              target: "step2",
              condition: "context.stepOutputs.step1.success === true",
            },
          ],
        };
        const completedSteps: CompletedStep[] = [
          { stepId: "step1", output: { success: false } },
        ];
        const stepOutputs = { step1: { success: false } };

        const result = getNextExecutableSteps(
          workflow,
          completedSteps,
          stepOutputs
        );

        expect(result).toHaveLength(0);
      });

      it("should not execute step when condition throws an error", () => {
        const workflow: WorkflowDefinition = {
          nodes: [
            { id: "step1", name: "Step 1", type: "inline" },
            { id: "step2", name: "Step 2", type: "inline" },
          ],
          edges: [
            {
              id: "e1",
              source: "step1",
              target: "step2",
              condition: "context.nonExistent.property.deep",
            },
          ],
        };
        const completedSteps: CompletedStep[] = [
          { stepId: "step1", output: {} },
        ];

        const result = getNextExecutableSteps(workflow, completedSteps, {});

        expect(result).toHaveLength(0);
      });

      it("should use workflowInput in condition evaluation", () => {
        const workflow: WorkflowDefinition = {
          nodes: [
            { id: "step1", name: "Step 1", type: "inline" },
            { id: "step2", name: "Step 2", type: "inline" },
          ],
          edges: [
            {
              id: "e1",
              source: "step1",
              target: "step2",
              condition: "context.workflowInput.enabled === true",
            },
          ],
        };
        const completedSteps: CompletedStep[] = [
          { stepId: "step1", output: {} },
        ];

        const result = getNextExecutableSteps(
          workflow,
          completedSteps,
          {},
          { enabled: true }
        );

        expect(result).toHaveLength(1);
        expect(result[0].stepId).toBe("step2");
      });
    });

    it("should include step metadata in executable steps", () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: "step1",
            name: "My Step",
            type: "http",
            description: "A test step",
            inputSchema: { type: "object" },
          },
        ],
        edges: [],
      };

      const result = getNextExecutableSteps(workflow, []);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        stepId: "step1",
        name: "My Step",
        type: "http",
        description: "A test step",
        inputSchema: { type: "object" },
      });
    });

    it("should handle complex DAG with diamond pattern", () => {
      //        start
      //       /     \
      //      A       B
      //       \     /
      //        end
      const workflow: WorkflowDefinition = {
        nodes: [
          { id: "start", name: "Start", type: "inline" },
          { id: "A", name: "A", type: "inline" },
          { id: "B", name: "B", type: "inline" },
          { id: "end", name: "End", type: "inline" },
        ],
        edges: [
          { id: "e1", source: "start", target: "A" },
          { id: "e2", source: "start", target: "B" },
          { id: "e3", source: "A", target: "end" },
          { id: "e4", source: "B", target: "end" },
        ],
      };

      // Initial: only start is executable
      let result = getNextExecutableSteps(workflow, []);
      expect(result.map((s) => s.stepId)).toEqual(["start"]);

      // After start: A and B are executable
      result = getNextExecutableSteps(workflow, [{ stepId: "start", output: {} }]);
      expect(result.map((s) => s.stepId).sort()).toEqual(["A", "B"]);

      // After A only: end is not executable yet
      result = getNextExecutableSteps(workflow, [
        { stepId: "start", output: {} },
        { stepId: "A", output: {} },
      ]);
      expect(result.map((s) => s.stepId)).toEqual(["B"]);

      // After A and B: end is executable
      result = getNextExecutableSteps(workflow, [
        { stepId: "start", output: {} },
        { stepId: "A", output: {} },
        { stepId: "B", output: {} },
      ]);
      expect(result.map((s) => s.stepId)).toEqual(["end"]);
    });

    it("should return empty array for empty workflow", () => {
      const workflow: WorkflowDefinition = {
        nodes: [],
        edges: [],
      };

      const result = getNextExecutableSteps(workflow, []);

      expect(result).toEqual([]);
    });
  });

  describe("isWorkflowComplete", () => {
    it("should return true when all nodes are completed", () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          { id: "step1", name: "Step 1", type: "inline" },
          { id: "step2", name: "Step 2", type: "inline" },
        ],
        edges: [],
      };
      const completedSteps: CompletedStep[] = [
        { stepId: "step1", output: {} },
        { stepId: "step2", output: {} },
      ];

      const result = isWorkflowComplete(workflow, completedSteps);

      expect(result).toBe(true);
    });

    it("should return false when some nodes are not completed", () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          { id: "step1", name: "Step 1", type: "inline" },
          { id: "step2", name: "Step 2", type: "inline" },
        ],
        edges: [],
      };
      const completedSteps: CompletedStep[] = [
        { stepId: "step1", output: {} },
      ];

      const result = isWorkflowComplete(workflow, completedSteps);

      expect(result).toBe(false);
    });

    it("should return true for empty workflow", () => {
      const workflow: WorkflowDefinition = {
        nodes: [],
        edges: [],
      };

      const result = isWorkflowComplete(workflow, []);

      expect(result).toBe(true);
    });

    it("should return false when no steps are completed for non-empty workflow", () => {
      const workflow: WorkflowDefinition = {
        nodes: [{ id: "step1", name: "Step 1", type: "inline" }],
        edges: [],
      };

      const result = isWorkflowComplete(workflow, []);

      expect(result).toBe(false);
    });

    it("should handle extra completed steps not in workflow", () => {
      const workflow: WorkflowDefinition = {
        nodes: [{ id: "step1", name: "Step 1", type: "inline" }],
        edges: [],
      };
      const completedSteps: CompletedStep[] = [
        { stepId: "step1", output: {} },
        { stepId: "unknown-step", output: {} },
      ];

      const result = isWorkflowComplete(workflow, completedSteps);

      expect(result).toBe(true);
    });
  });
});
