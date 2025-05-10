import { z } from "zod";
import { Session, ProfileInfo } from "@zowe/imperative";
import {
  Copy,
  IDataSet,
  ICopyDatasetOptions,
  IZosFilesResponse,
} from "@zowe/zos-files-for-zowe-sdk";
import { SessionManager } from "../../core/sessionManager.js";

export const schema = z.object({
  source: z.string().describe("Source PS file path"),
  destination: z.string().describe("Destination PS file path"),
});

export async function run(
  step: { with: { source: string; destination: string } },
  context: any
): Promise<{ success: boolean; source?: string; destination?: string }> {
  const session = await SessionManager.getInstance().getSession();

  if (!session) {
    console.error("❌ Failed to authenticate: Session is undefined.");
    return { success: false };
  }

  const { source, destination } = step.with;

  const toDataSet: IDataSet = {
    dsn: destination,
  };

  const copyOptions: ICopyDatasetOptions = {
    "from-dataset": {
      dsn: source,
    },
    enq: "SHR",
    replace: true,
    safeReplace: true,
  };

  const response: IZosFilesResponse = await Copy.dataSet(
    session,
    toDataSet,
    copyOptions
  );
  if (!response.success) {
    console.error(`❌ Copy operation failed. ${response.errorMessage}`);
    return { success: false };
  }

  console.log(`✅ File copied successfully from ${source} to ${destination}`);
  return { success: true, source, destination };
}
