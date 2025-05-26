import { z } from "zod";

const schema = z.object({
  expression: z.string(),
});

export async function run(
  step: { with: { expression: string } },
  _context: unknown
): Promise<{ success: boolean; result: unknown }> {
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${step.with.expression}`)();
    return { success: true, result };
  } catch (error) {
    return { success: false, result: String(error) };
  }
}

export { schema };
