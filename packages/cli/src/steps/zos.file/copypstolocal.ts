import { z } from "zod";
import { Spinner } from "../../core/spinnerManager.js";
import { ConfigManager } from "../../core/configManager.js";

import {
  Download
} from "@zowe/zos-files-for-zowe-sdk";
import { SessionManager } from "../../core/sessionManager.js";

export const schema = z.object({
  source: z.string().describe("Source PS file path"),
  destination: z.string().describe("Destination PS file path"),
  connection: z.string().optional(),
});

export async function run(
  step: { with: { source: string; destination: string, connection: string } },
  context: any
): Promise<{ success: boolean; source?: string; destination?: string }> {
  let { connection } = step.with;
  if (!connection) {
    if (!context.env.ZOSConnection) {
      const config = ConfigManager.getInstance().getConfig();
      connection = config?.defaultZosConnection ?? "";
    } else {
      connection = context.env.ZOSConnection.toUpperCase();
    }
  }
  const session = await SessionManager.getInstance().getSession(connection);


  if (!session) {
    Spinner.error("Failed to authenticate: Session is undefined.");
    return { success: false };
  }

  const { source, destination } = step.with;

  try {
    const response= await Download.dataSet(session, source, {file: destination});
    if (!response.success) {
      Spinner.error(`Copy operation failed. ${response.errorMessage}`);
      return { success: false };
    }
    Spinner.log(`✅ File copied successfully from ${connection}|${source} to ${destination}`);
    return { success: true, source, destination };

  } catch (error) {
    const errorMessage = (error as any)?.mDetails?.msg || "Unknown error";
    const formattedErrorMessage = errorMessage.replace(/\n/g, ". ");
    Spinner.error(`❌ Copy operation failed. ${formattedErrorMessage}`);
    return { success: false };
  }
  
}
