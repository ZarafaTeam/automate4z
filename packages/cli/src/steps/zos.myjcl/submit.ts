import { z } from "zod";
import { Spinner } from "../../core/spinnerManager.js";
import { SubmitJobs, ISubmitJclNotifyParm } from "@zowe/zos-jobs-for-zowe-sdk";
import { SessionManager } from "../../core/sessionManager.js";
import { ConfigManager } from "../../core/configManager.js";
import { connect } from "http2";

export const schema = z.object({
  jcl: z.string(),
  connection: z.string().optional(),
});

export async function run(
  step: { with: { jcl: string, connection: string } },
  context: any
): Promise<{ success: boolean; jobname?: string; jobid?: string; retcode?: string }> {
  let { jcl, connection } = step.with;

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

    try {
    const options : ISubmitJclNotifyParm = {
      jcl: jcl,
      watchDelay: 500,
      internalReaderFileEncoding: "1147"
    }
    const response: { jobname?: string; jobid?: string; status?: string; retcode?: string; errorMessage?: string } | undefined = 
      await SubmitJobs.submitJclNotifyCommon(session, options);

    if (!response || response.errorMessage) {
      Spinner.error(`JCL submit failed. ${response?.errorMessage || "Unknown error"}`);
      return { success: false };
    }

    Spinner.log(`✅ JCL submitted successfully on ${connection} | JobName: ${response.jobname} | Jobid : ${response.jobid} | Status : ${response.status} | Retcode : ${response.retcode}`);
    return { success: true, jobname: response.jobname, jobid: response.jobid, retcode: response.retcode };

  } catch (error) {
    const errorMessage = (error as any)?.mDetails?.msg || "Unknown error";
    Spinner.error(`✅ executing job failed ${errorMessage}`);
    return { success: false };
  }


}
