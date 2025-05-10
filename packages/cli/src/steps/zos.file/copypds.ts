import { z } from "zod";
import { ITaskWithStatus } from "@zowe/imperative";
import {
  Copy,
  List,
  IDataSet,
  ICopyDatasetOptions,
  IZosFilesResponse,
} from "@zowe/zos-files-for-zowe-sdk";
import { SessionManager } from "../../core/sessionManager.js";

export const schema = z.object({
  source: z.string().describe("Source PDS path"),
  destination: z.string().describe("Destination PDS path"),
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

  try {
    const isPDSSource = await Copy.isPDS(session, source);
    if (!isPDSSource) {
      console.error(`❌ Source ${source} is not a PDS.`);
      return { success: false };
    }

    const isPDSDestination = await Copy.isPDS(session, destination);
    if (!isPDSDestination) {
      console.error(`❌ Destination ${destination} is not a PDS.`);
      return { success: false };
    }

    const task: ITaskWithStatus = undefined as unknown as ITaskWithStatus;
    const sourceResponse = await List.allMembers(session, source);
    const sourceMemberList: Array<string> =
      sourceResponse.apiResponse.items.map(
        (item: { member: string }) => item.member
      );
    const response: IZosFilesResponse = await Copy.copyPDS(
      session,
      source,
      destination,
      task,
      sourceMemberList
    );

    if (response.success) {
      console.log(`✅ Copy operation completed successfully.`);
      return { success: true, source, destination };
    }

    console.error(`❌ Copy operation failed. ${response.errorMessage}`);
    return { success: false };
  } catch (error) {
    const errorMessage = (error as any)?.details?.msg || "Unknown error";
    console.error(`❌ Copy operation failed. ${errorMessage}`);
    return { success: false };
  }
}
