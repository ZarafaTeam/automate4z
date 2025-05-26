import { z } from "zod";
import { Spinner } from "../../core/spinnerManager.js";

export const schema = z.object({
  seconds: z.number().min(0).max(60),
});

// Fonction utilitaire pour attendre n secondes
function wait(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export async function run(step: { with: { seconds: number } }, context: any) {
  const { seconds } = step.with;

  //Spinner.log(`⏳ Waiting for ${seconds} seconds...`);
  await wait(seconds); // Attente
  Spinner.log(`✅ Done waiting for ${seconds} seconds.`);

  return { success: true };
}
