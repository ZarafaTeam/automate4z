import { z } from "zod";
import { Spinner } from "../../core/spinnerManager.js";
import Mustache from "mustache";
import axios from "axios";
import { URL } from "url";
import path from "path";
import { promises as fs} from "fs";


export const schema = z.object({
    template: z.string().nonempty(),
    data: z.record(z.any()),
    outputPath: z.string().optional(),
});



export async function run(step: { with: { template: string, data:any, outputPath: string } }, context: any): Promise<{ success: boolean; rendered: string }> {
  const { template, data, outputPath } = step.with;

  let templateContent: string;
  if (template.startsWith("http://") || template.startsWith("https://")) {
    const response = await axios.get(template);
    templateContent = response.data;
  } else if (template.startsWith("file://")) {
    const localPath = new URL(template).pathname;  
    templateContent = await fs.readFile(path.resolve(localPath), "utf-8");
  } else {
    templateContent = await fs.readFile(path.resolve(template), "utf-8");
  }

  const rendered = Mustache.render(templateContent, data);

  if (outputPath) {
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, rendered, "utf-8");
  }
  
  Spinner.log(`✅ Done render template.`);

  return { success: true, rendered };
}
