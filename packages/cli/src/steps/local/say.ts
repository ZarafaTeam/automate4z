import { z } from "zod";

export const schema = z.object({
  name: z.string(),
});

export async function run(step: { with: { name: string } }, context: any) {
  const name = step.with.name;
  console.log(`👋 Hello ${name} from plugin!`);
  return { message: `Hello ${name}!` };
}
