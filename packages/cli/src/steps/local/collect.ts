import { z } from "zod";

export const schema = z.object({
  prefix: z.string(),
  key: z.string(),
});

interface Step {
  with: {
    prefix: string;
    key: string;
  };
}

export async function run(
  step: Step,
  context: { getEnvObject: () => Record<string, any> }
) {
  const { prefix, key } = step.with;
  const collected = [];

  const env = context.getEnvObject();
  const matchingKeys = Object.keys(env).filter(
    (k) => k.startsWith(prefix + "#") && k.endsWith("." + key)
  );

  for (const fullKey of matchingKeys) {
    collected.push(env[fullKey]);
  }

  return { success: true, result: collected };
}
