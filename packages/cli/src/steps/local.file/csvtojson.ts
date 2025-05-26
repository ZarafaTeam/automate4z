import { z } from "zod";
import fs from "fs";
import { Spinner } from "../../core/spinnerManager.js";

export const schema = z.object({
  source: z.string().describe("Source file path"),
  destination: z.string().describe("Destination file path"),
});

export async function run(
  step: { with: { source: string; destination: string } },
  context: any
) {
  const { source, destination } = step.with;

  try {
    const csvData = fs.readFileSync(source, "utf-8");
    const lines = csvData.split("\n").filter(line => line.trim() !== "");
    const headers = lines[0].split(";").map(header => header.trim());
    const sanitizedHeaders = headers.map(header => {
      if (header.startsWith('"') && header.endsWith('"')) {
        return header.slice(1, -1);
      }
      return header;
    });
    
    const jsonData = lines.slice(1).map(line => {
      const values = line.split(";").map(value => value.trim());

      return sanitizedHeaders.reduce((acc, header, index) => {
        if (values[index]?.startsWith('"') && values[index]?.endsWith('"')) {
          acc[header] = values[index].slice(1, -1).trim(); // Treat as string
        } else if (values[index]?.toLowerCase() === "true" || values[index]?.toLowerCase() === "false") {
          acc[header] = values[index].toLowerCase() === "true"; // Treat as boolean
        } else if (!isNaN(Number(values[index]))) {
          acc[header] = Number(values[index]); // Treat as number
        } else {
          acc[header] = values[index]; // Fallback to string if neither
        }
        return acc;
      }, {} as Record<string, string | number | boolean>);
    });
    fs.writeFileSync(destination, JSON.stringify(jsonData, null, 2), "utf-8");
    Spinner.log(`✅ Conversion CSV==>JSON completed successfully, from ${source} to ${destination}`);
    return { success: true, source, destination };
  } catch (error) {
    const errorMessage = (error as any)?.message || "Unknown error";
    Spinner.error(`Conversion csvTojson failed. ${errorMessage}`);
    return { success: false, source, destination };
  }
}