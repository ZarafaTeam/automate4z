import { z } from "zod";
import fs from "fs";

export const schema = z.object({
  source: z.string().describe("Source PS file path"),
  destination: z.string().describe("Destination PS file path"),
});

export async function run(
  step: { with: { source: string; destination: string } },
  context: any
) {
  const { source, destination } = step.with;

  if (!fs.existsSync(source)) {
    console.error(`❌ Source file does not exist: ${source}`);
    return { success: false, source, destination };
  }

  try {
    fs.copyFileSync(source, destination);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Failed to copy file: ${error.message}`);
    } else {
      console.error(`❌ Failed to copy file: ${String(error)}`);
    }
    return { success: false, source, destination };
  }
  console.log(`✅ File copied successfully from ${source} to ${destination}`);
  return { success: true, source, destination };
}
