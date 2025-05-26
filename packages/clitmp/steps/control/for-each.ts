import { z } from "zod";
import { executeStep } from "../../core/runner.js";
import { Context } from "../../core/context.js";

export const schema = z.object({
  items: z.array(z.any()),
});

export async function run(
  step: { with: { items: any[] }; steps: any[]; name: string },
  context: Context
) {
  const items = step.with.items;
  const innerSteps = step.steps;

  if (!Array.isArray(innerSteps)) {
    throw new Error(
      `❌ "steps" must be an array inside control.for-each step "${step.name}"`
    );
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const scopedContext = new Context({ ...context.getEnvObject(), item });

    for (const subStep of innerSteps) {
      const loopedStep = {
        ...subStep,
        name: `${subStep.name}#${i + 1}`,
      };
      await executeStep(loopedStep, scopedContext, context, item);
    }
  }

  return { loopCount: items.length };
}
