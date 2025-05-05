import * as fs from "fs";
import * as yaml from "yaml";
import { z } from "zod";

const WorkflowSchema = z.object({
  env: z.record(z.any()).optional(),
  steps: z.array(
    z.object({
      name: z.string(),
      action: z.string(),
      with: z.record(z.any()).optional(),
      if: z.any().optional(),
      active: z.any().optional(),
      forEach: z.any().optional(),
      steps: z.array(z.any()).optional(), // pour control.for-each
      output: z.record(z.string()).optional(),
    })
  ),
});

export function loadWorkflowFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = yaml.parse(content);

  const validation = WorkflowSchema.safeParse(parsed);
  if (!validation.success) {
    console.error("❌ Invalid workflow YAML:", validation.error.format());
    process.exit(1);
  }

  return validation.data;
}
