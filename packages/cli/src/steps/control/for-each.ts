import { z } from "zod";
import { Context } from "../../core/context.js";
import { getStepHandler, type HandlerMap } from "../index.js";
import type { Step, StepHandler } from "../../types/step.js";

const schema = z.object({
  items: z.array(z.unknown()),
  steps: z.array(
    z.object({
      name: z.string(),
      action: z.string(),
      with: z.record(z.unknown()).optional(),
    })
  ),
});

export async function run(
  data: z.infer<typeof schema>,
  context: Context
): Promise<{ loopCount: number }> {
  const { items, steps } = data;
  let loopCount = 0;

  for (const item of items) {
    context.setVariable("item", item);
    for (const step of steps) {
      const handler = getStepHandler(step.action as keyof HandlerMap);
      if (!handler) {
        throw new Error(`Handler not found for action: ${step.action}`);
      }
      await (handler as StepHandler<Record<string, unknown>, unknown>).run(
        { name: step.name, action: step.action, with: step.with || {} } as Step<
          Record<string, unknown>
        >,
        context
      );
    }
    loopCount++;
  }

  return { loopCount };
}

export { schema };
