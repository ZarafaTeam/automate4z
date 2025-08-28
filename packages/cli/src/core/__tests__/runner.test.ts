import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { runWorkflow } from "../runner.js";
import type { WorkflowResult, Workflow } from "../../types/workflow.js";
import * as yaml from "js-yaml";
import * as fs from "fs";
import { getStepHandler } from "../../steps/index.js";
import type { StepHandler } from "../../types/step.js";

vi.mock("js-yaml");
vi.mock("fs");
vi.mock("../../steps/index.js");

describe("WorkflowRunner", () => {
  const mockWorkflow: Workflow = {
    env: {
      testVar: "value",
    },
    steps: [
      {
        name: "step1",
        action: "local.eval",
        with: {
          expression: "1 + 1",
        },
      },
      {
        name: "step2",
        action: "local.log",
        with: {
          message: "test",
        },
      },
    ],
  };

  const mockResult: WorkflowResult = {
    success: true,
    steps: [
      {
        name: "step1",
        status: "success",
        output: 2,
      },
      {
        name: "step2",
        status: "success",
      },
    ],
  };

  const mockStepHandler: StepHandler<Record<string, unknown>, unknown> = {
    schema: {
      safeParse: vi.fn().mockReturnValue({ success: true }),
    },
    run: vi.fn().mockResolvedValue({ success: true, result: "success" }),
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Mock file reading
    vi.mocked(fs.readFileSync).mockReturnValue("mock yaml content");
    vi.mocked(yaml.load).mockReturnValue(mockWorkflow);

    // Mock step handler
    vi.mocked(getStepHandler).mockReturnValue(mockStepHandler);
    vi.mocked(runWorkflow).mockResolvedValue(mockResult);
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe("runWorkflow", () => {
    it("devrait exécuter un workflow avec succès", async () => {
      const result = await runWorkflow(mockWorkflow, false);
      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(2);
      expect(mockStepHandler.run).toHaveBeenCalledTimes(2);
    });

    it("devrait injecter les variables d'environnement", async () => {
      const env = { customVar: "test" };
      const result = await runWorkflow(mockWorkflow, false);
      expect(result.success).toBe(true);
      expect(mockStepHandler.run).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          env: expect.objectContaining(env),
        })
      );
    });

    it("devrait gérer les erreurs de validation de step", async () => {
      vi.mocked(mockStepHandler.schema.safeParse).mockReturnValue({
        success: false,
        error: new Error("Validation error"),
      });

      const mockConsoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await runWorkflow(mockWorkflow, false);
      expect(result.success).toBe(false);
      expect(mockConsoleError).toHaveBeenCalled();

      mockConsoleError.mockRestore();
    });

    it("devrait gérer les erreurs d'exécution de step", async () => {
      vi.mocked(mockStepHandler.run).mockRejectedValue(new Error("Step error"));

      const mockConsoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await runWorkflow(mockWorkflow, false);

      expect(result.success).toBe(false);
      expect(mockConsoleError).toHaveBeenCalled();

      mockConsoleError.mockRestore();
    });

    it("devrait gérer les conditions if", async () => {
      const workflowWithCondition = {
        ...mockWorkflow,
        steps: [
          {
            ...mockWorkflow.steps[0],
            if: 'env.testVar === "value"',
          },
        ],
      };

      vi.mocked(yaml.load).mockReturnValue(workflowWithCondition);

      const result = await runWorkflow(workflowWithCondition, false);

      expect(result.success).toBe(true);
      expect(mockStepHandler.run).toHaveBeenCalled();
    });

    it("devrait gérer les boucles forEach", async () => {
      const workflowWithLoop = {
        ...mockWorkflow,
        steps: [
          {
            name: "loop",
            action: "control.for-each",
            with: {
              items: ["a", "b", "c"],
            },
            steps: [
              {
                name: "sub-step",
                action: "local.log",
                with: {
                  message: "{{ item }}",
                },
              },
            ],
          },
        ],
      };

      vi.mocked(yaml.load).mockReturnValue(workflowWithLoop);

      const result = await runWorkflow(workflowWithLoop, false);

      expect(result.success).toBe(true);
      expect(mockStepHandler.run).toHaveBeenCalledTimes(3);
    });

    it("devrait gérer les erreurs de lecture de fichier", async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error("File read error");
      });

      const mockConsoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(runWorkflow(mockWorkflow, false)).rejects.toThrow();
      expect(mockConsoleError).toHaveBeenCalled();

      mockConsoleError.mockRestore();
    });

    it("devrait gérer les erreurs de parsing YAML", async () => {
      vi.mocked(yaml.load).mockImplementation(() => {
        throw new Error("YAML parse error");
      });

      const mockConsoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(runWorkflow(mockWorkflow, false)).rejects.toThrow();
      expect(mockConsoleError).toHaveBeenCalled();

      mockConsoleError.mockRestore();
    });
  });
});
