import { Context } from "../core/context.js";

export interface Step<T = Record<string, unknown>> {
  name: string;
  action: string;
  with?: T;
  if?: string;
  loop?: string;
  continueOnError?: boolean;
}

export interface StepResult<T = unknown> {
  success: boolean;
  output?: T;
  error?: Error;
}

export interface StepHandler<
  TInput = Record<string, unknown>,
  TOutput = unknown
> {
  schema: {
    safeParse: (data: unknown) => { success: boolean; error?: unknown };
  };
  run: (step: Step<TInput>, context: Context) => Promise<StepResult<TOutput>>;
}
