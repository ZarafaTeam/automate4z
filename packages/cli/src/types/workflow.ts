export interface WorkflowResult {
  success: boolean;
  steps: Array<{
    name: string;
    status: "success" | "failure" | "skipped";
    output?: unknown;
    error?: Error;
  }>;
  workflowStatus?: "success" | "failure";
}

export interface WorkflowStep {
  name: string;
  action: string;
  with?: Record<string, unknown>;
  if?: string;
  loop?: string;
  continueOnError?: boolean;
}

export interface Workflow {
  name?: string;
  description?: string;
  version?: string;
  env?: Record<string, unknown>;
  steps: WorkflowStep[];
}

export interface StepHandler {
  schema: {
    safeParse: (data: unknown) => { success: boolean };
  };
  run: (data: unknown) => Promise<{ result: string }>;
}
