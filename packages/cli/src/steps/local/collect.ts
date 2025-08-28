import { z } from "zod";
import { Context } from "../../core/context.js";

interface Step {
  with: {
    source: string;
    pattern: string;
  };
}

const schema = z.object({
  source: z.string(),
  pattern: z.string(),
});

export async function run(
  step: Step,
  context: Context
): Promise<{ success: boolean; result: unknown[] }> {
  const env = context as unknown as {
    getEnvObject: () => Record<string, unknown>;
  };
  const source = env.getEnvObject()[step.with.source] as unknown[];
  const pattern = step.with.pattern;
  const result = source.filter((item) => {
    // eslint-disable-next-line no-new-func
    const fn = new Function("item", `return ${pattern}`);
    return fn(item);
  });
  return { success: true, result };
}

export { schema };
