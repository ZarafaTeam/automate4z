import { z } from "zod";

export const schema = z.object({
  expression: z.string(),
});

export async function run(
  step: { with: { expression: string } },
  context: any
) {
  const expr = step.with.expression;
  try {
    const fn = new Function("env", "item", `return ${expr}`);
    const result = fn(context.getEnvObject(), context.getEnvObject().item);
    return { success: true, result };
  } catch (err) {
    console.error(`❌ Failed to evaluate expression: ${expr}`);
    console.error(err);
    throw err;
  }
}
