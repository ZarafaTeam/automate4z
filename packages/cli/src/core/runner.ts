import { loadWorkflowFile } from "./loader.js";
import { getStepHandler } from "../steps/index.js";
import { Context } from "./context.js";
import type { Step } from "../types/step.js";

function shouldRunStep(
  step: Step,
  workflowStatus: "success" | "failure"
): boolean {
  if (!step.if) return true; // No condition, run the step
  if (step.if === "always()") return true; // Always run this step
  if (step.if === "success()" && workflowStatus === "success") return true; // Run if workflow was successful
  if (step.if === "failure()" && workflowStatus === "failure") return true; // Run if workflow failed
  return false; // Default case, do not run the step
}

export async function runWorkflow(
  filePath: string,
  cliEnv: Record<string, string> = {},
  debugMode: boolean = false
) {
  const workflow = loadWorkflowFile(filePath);
  const fileEnv = workflow.env ?? {};
  const steps: Step[] = workflow.steps ?? [];
  let workflowStatus: "success" | "failure" = "success";

  const env = { ...fileEnv, ...cliEnv };
  const context = new Context(env);
  console.log(`🔄 automate4z is running workflow file "${filePath}"`);
  for (const step of steps) {
    if (!shouldRunStep(step, workflowStatus)) {
      console.log(`⏭️  Step "${step.name}" skipped (condition "if" not met).`);
      continue;
    }

    const loopItems = context.resolve(step.forEach);

    if (Array.isArray(loopItems)) {
      for (let i = 0; i < loopItems.length; i++) {
        const item = loopItems[i];
        const loopStep = { ...step, name: `${step.name}#${i + 1}` };
        const scopedContext = new Context({ ...context.getEnvObject(), item });
        await executeStep(loopStep, scopedContext, context, debugMode, item);
      }
      continue;
    }
    try {
      const result = await executeStep(step, context, context, debugMode);
      if (result) {
        if (workflowStatus === "success") {
          workflowStatus = "success";
        } else workflowStatus = "failure";
      } else {
        workflowStatus = "failure";
      }
      //console.log(`✅ Step "${step.name}" completed, workflowStatus : ${workflowStatus}.`);
    } catch (error) {
      console.error(`❌ Step "${step.name}" failed:`, error);
      workflowStatus = "failure";
    }
  }
}

export async function executeStep(
  step: Step,
  context: Context,
  parentContext: Context,
  debugMode: boolean = false,
  item?: any
): Promise<boolean> {
  //console.log(step);
  let condition: any;

  if (
    step.if === "always()" ||
    step.if === "success()" ||
    step.if === "failure()"
  ) {
    condition = true;
  } else {
    condition = context.resolve(step.if);
  }

  const ifPassed =
    condition === undefined ||
    condition === true ||
    condition === "true" ||
    condition === "1";

  if (!ifPassed) {
    console.log(`\n⏭️  Step "${step.name}" skipped (condition "if" not met).`);
    return true;
  }

  const rawActive = step.active;
  const resolvedActive = context.resolve(rawActive);
  const isActive =
    resolvedActive === undefined ||
    resolvedActive === true ||
    resolvedActive === "true";

  //console.log(`\n🔄 Running step "${step.name}"...`);
  console.log(`🔄 Running step "${step.name}", step.if = ${step.if}...`);
  if (!isActive) {
    console.log(`⏭️  Step "${step.name}" is inactive. Skipping.`);
    return true;
  }

  let handler;
  try {
    handler = getStepHandler(step.action);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌`, error.message);
      return false;
    } else {
      console.error(`❌ Failed to get handler for step "${step.name}":`, error);
      return false;
    }
    //process.exit(1);
  }

  if (handler) {
    let resolvedInputs = Object.fromEntries(
      Object.entries(step.with ?? {}).map(([k, v]) => [k, context.resolve(v)])
    );

    if (handler.schema) {
      const validation = handler.schema.safeParse(resolvedInputs);
      if (!validation.success) {
        console.error(`❌ Invalid input for step "${step.name}":`);
        console.error(validation.error.format());
        return false;
        //process.exit(1);
      }
      resolvedInputs = validation.data;
    }

    const result = await handler.run(
      { ...step, with: resolvedInputs },
      context
    );
    //console.log(`✅ Step "${step.name}" completed.`);
    //console.log(`🧪 Step "${step.name}" result:`, result);
    //console.log(`🧪 Step "${step.name}" context:`, context);

    parentContext.setOutput(step.name, result);

    if (step.output) {
      for (const [envKey, resultKey] of Object.entries(step.output)) {
        const value = result?.[resultKey];
        console.log(
          `📦 Exporting "${resultKey}" as env["${envKey}"] = ${value}`
        );
        if (value !== undefined) {
          parentContext.setEnv(envKey, value);
        }
      }
    }
    if (debugMode) console.log(`🧪 Step "${step.name}" returned:`, result);
    return result.success ?? true;
  } else {
    const result = { success: false };
    parentContext.setOutput(step.name, result);
    if (debugMode) console.log(`🧪 Step "${step.name}" returned:`, result);
    return result.success ?? false;
  }
}
