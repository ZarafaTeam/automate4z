import { z } from "zod";

export const schema = z.object({
  message: z.string(),
});

export async function run(step: { with: { message: string } }, context: any) {
  const message = step.with.message;
  console.log(message);
  return { success: true, message };
}
