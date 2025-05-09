import { z } from "zod";

export const schema = z.object({
  word: z.string(),
});

export async function run(step: { with: { word: string } }, context: any) {
  const word = step.with.word.toUpperCase();
  console.log(`📣 ${word}!`);
  return { success: true, shouted: word };
}
