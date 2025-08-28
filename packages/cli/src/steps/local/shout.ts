import { z } from "zod";

const schema = z.object({
  word: z.string(),
});

export async function run(
  step: { with: { word: string } },
  _context: unknown
): Promise<{ success: boolean; shouted: string }> {
  const shouted = step.with.word.toUpperCase();
  console.log(shouted);
  return { success: true, shouted };
}

export { schema };
