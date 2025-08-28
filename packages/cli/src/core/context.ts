import { Session } from "@zowe/imperative";
import type { Workflow, WorkflowStep } from "../types/workflow.js";

export class Context {
  private static instance: Context;
  private workflow?: Workflow;
  private currentStep?: WorkflowStep;
  private variables: Record<string, unknown>;
  private outputs: Record<string, unknown>;
  private session?: Session;
  private stepResults: Array<{
    name: string;
    status: "success" | "failure" | "skipped";
    output?: unknown;
    error?: Error;
  }>;

  private constructor() {
    this.variables = {};
    this.outputs = {};
    this.stepResults = [];
  }

  public static getInstance(): Context {
    if (!Context.instance) {
      Context.instance = new Context();
    }
    return Context.instance;
  }

  public setWorkflow(workflow: Workflow): void {
    this.workflow = workflow;
  }

  public getWorkflow(): Workflow | undefined {
    return this.workflow;
  }

  public setCurrentStep(step: WorkflowStep): void {
    this.currentStep = step;
  }

  public getCurrentStep(): WorkflowStep | undefined {
    return this.currentStep;
  }

  public setVariable(name: string, value: unknown): void {
    this.variables[name] = value;
  }

  public getVariable(name: string): unknown {
    return this.variables[name];
  }

  public setOutput(name: string, value: unknown): void {
    this.outputs[name] = value;
  }

  public getOutput(name: string): unknown {
    return this.outputs[name];
  }

  public setSession(session: Session): void {
    this.session = session;
  }

  public getSession(): Session | undefined {
    return this.session;
  }

  public addStepResult(
    name: string,
    status: "success" | "failure" | "skipped",
    output?: unknown,
    error?: Error
  ): void {
    this.stepResults.push({ name, status, output, error });
  }

  public getStepResults(): Array<{
    name: string;
    status: "success" | "failure" | "skipped";
    output?: unknown;
    error?: Error;
  }> {
    return this.stepResults;
  }

  public reset(): void {
    this.workflow = undefined;
    this.currentStep = undefined;
    this.variables = {};
    this.outputs = {};
    this.session = undefined;
    this.stepResults = [];
  }
}
