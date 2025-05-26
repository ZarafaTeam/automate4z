import { z } from "zod";

const schema = z.object({
  name: z.string(),
});

export async function run(
  step: { with: { name: string } },
  _context: unknown
): Promise<{ success: boolean; message: string }> {
  const message = `Hello, ${step.with.name}!`;
  console.log(message);
  return { success: true, message };
}

export { schema };
