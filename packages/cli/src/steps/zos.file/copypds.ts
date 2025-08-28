import { z } from "zod";
import { Context } from "../../core/context.js";

const schema = z.object({
  source: z.string(),
  destination: z.string(),
});

export async function run(
  step: { with: { source: string; destination: string } },
  _context: Context
): Promise<{ success: boolean; source?: string; destination?: string }> {
  const { source, destination } = step.with;

  try {
    // Logique de copie PDS à implémenter
    return { success: true, source, destination };
  } catch (error) {
    console.error(
      `Erreur lors de la copie du PDS ${source} vers ${destination}:`,
      error
    );
    return { success: false };
  }
}

export { schema };
