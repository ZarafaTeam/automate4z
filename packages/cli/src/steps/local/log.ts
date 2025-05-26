import { z } from "zod";

const schema = z.object({
  message: z.string(),
});

export async function run(
  step: { with: { message: string } },
  _context: unknown
): Promise<{ success: boolean; message: string }> {
  console.log(step.with.message);
  return { success: true, message: step.with.message };
}

export { schema };
