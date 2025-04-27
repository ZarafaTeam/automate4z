import { loadWorkflowFile } from "./loader.js";
import { getStepHandler } from "../steps/index.js";
import { Context } from "./context.js";
import type { Step } from "../types/step.js";

export async function runWorkflow(
  filePath: string,
  cliEnv: Record<string, string> = {}
) {
  const workflow = loadWorkflowFile(filePath);
  const fileEnv = workflow.env ?? {};
  const steps: Step[] = workflow.steps ?? [];

  const env = { ...fileEnv, ...cliEnv };
  const context = new Context(env);

  for (const step of steps) {
    const loopItems = context.resolve(step.forEach);

    if (Array.isArray(loopItems)) {
      for (let i = 0; i < loopItems.length; i++) {
        const item = loopItems[i];
        const loopStep = { ...step, name: `${step.name}#${i + 1}` };
        const scopedContext = new Context({ ...context.getEnvObject(), item });
        await executeStep(loopStep, scopedContext, context, item);
      }
      continue;
    }

    await executeStep(step, context, context);
  }
}

export async function executeStep(
  step: Step,
  context: Context,
  parentContext: Context,
  item?: any
) {
  const condition = context.resolve(step.if);
  const ifPassed =
    condition === undefined ||
    condition === true ||
    condition === "true" ||
    condition === "1";

  if (!ifPassed) {
    console.log(`⏭️  Step "${step.name}" skipped (condition "if" not met).`);
    return;
  }

  const rawActive = step.active;
  const resolvedActive = context.resolve(rawActive);
  const isActive =
    resolvedActive === undefined ||
    resolvedActive === true ||
    resolvedActive === "true";

  console.log(`🔄 Running step "${step.name}"...`);
  if (!isActive) {
    console.log(`⏭️  Step "${step.name}" is inactive. Skipping.`);
    return;
  }

  const handler = getStepHandler(step.action);

  let resolvedInputs = Object.fromEntries(
    Object.entries(step.with ?? {}).map(([k, v]) => [k, context.resolve(v)])
  );

  if (handler.schema) {
    const validation = handler.schema.safeParse(resolvedInputs);
    if (!validation.success) {
      console.error(`❌ Invalid input for step "${step.name}":`);
      console.error(validation.error.format());
      process.exit(1);
    }
    resolvedInputs = validation.data;
  }

  const result = await handler.run({ ...step, with: resolvedInputs }, context);
  //console.log(`✅ Step "${step.name}" completed.`);
  //console.log(`🧪 Step "${step.name}" result:`, result);
  //console.log(`🧪 Step "${step.name}" context:`, context);

  parentContext.setOutput(step.name, result);

  if (step.output) {
    for (const [envKey, resultKey] of Object.entries(step.output)) {
      const value = result?.[resultKey];
      console.log(`📦 Exporting "${resultKey}" as env["${envKey}"] = ${value}`);
      if (value !== undefined) {
        parentContext.setEnv(envKey, value);
      }
    }
  }

  console.log(`🧪 Step "${step.name}" returned:`, result);
}
