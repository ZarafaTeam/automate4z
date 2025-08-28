import { Session, ProfileInfo } from "@zowe/imperative";
import { AUTH_TYPE_BASIC } from "@zowe/imperative/lib/rest/src/session/SessConstants.js";
import { ConfigManager } from "./configManager.js";
import keytar from "keytar";

export class SessionManager {
  private static instance: SessionManager;
  private readonly sessions: Map<string, Session>;

  private constructor() {
    this.sessions = new Map();
  }

  private readonly authentification = async (
    type: string,
    profile: string,
    hostname: string,
    port: number,
    user: string,
    password: string
  ): Promise<Session | undefined> => {
    if (type === "zowe") {
      const profileInfo = new ProfileInfo("zowe");
      await profileInfo.readProfilesFromDisk();
      const allProfAttrs = profileInfo.getAllProfiles();
      const zosmfProfAttrs = allProfAttrs.find((p) => p.profName === profile);
      if (zosmfProfAttrs) {
        const zosmfMergedArgs = profileInfo.mergeArgsForProfile(
          zosmfProfAttrs,
          { getSecureVals: true }
        );
        return ProfileInfo.createSession(zosmfMergedArgs.knownArgs);
      } else {
        console.error(`✘ No Zowe profile found for: ${profile}`);
        return undefined;
      }
    } else if (type === "basic") {
      const config = {
        hostname,
        port,
        basePath: "ibmzosmf/api/v1",
        user,
        password,
        rejectUnauthorized: false,
        protocol: "https",
        type: AUTH_TYPE_BASIC,
        serviceProtocol: "SSLv23_method",
        base64EncodedAuth: "YTY0M9J4AMp9pvmWFzUXWg==", // à adapter
      };

      const session = new Session({
        hostname: config.hostname,
        port: config.port,
        user: config.user,
        password: config.password,
        basePath: config.basePath,
        type: AUTH_TYPE_BASIC,
        rejectUnauthorized: config.rejectUnauthorized ?? false,
      });

      return session;
    } else {
      console.error(`✘ Invalid authentication type ${type}`);
      return undefined;
    }
  };

  public async initialize(sessionId: string): Promise<Session | undefined> {
    try {
      const config = ConfigManager.getInstance().getConfig();
      if (!config) throw new Error("Configuration is null or undefined");

      const connectionIndex = config.zosConnection.findIndex(
        (c) => c.name === sessionId
      );
      if (connectionIndex === -1) {
        throw new Error(
          `Default ZOS connection '${config.defaultZosConnection}' not found in the configuration`
        );
      }

      const keyUser = `${sessionId.toUpperCase()}_USER`;
      const keyPwd = `${sessionId.toUpperCase()}_PWD`;

      const user = (await keytar.getPassword("automate4z", keyUser)) ?? "";
      const password = (await keytar.getPassword("automate4z", keyPwd)) ?? "";

      const session = await this.authentification(
        config.zosConnection[connectionIndex].type,
        config.zosConnection[connectionIndex].profile ?? "",
        config.zosConnection[connectionIndex].hostname ?? "",
        config.zosConnection[connectionIndex].port ?? 443,
        user,
        password
      );

      if (session) {
        return session;
      } else {
        console.error("✘ Session creation failed");
        return undefined;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("✘ Error during authentication:", error.message);
      } else {
        console.error("✘ Unexpected error:", error);
      }
      return undefined;
    }
  }

  public async getSession(sessionId: string): Promise<Session | undefined> {
    sessionId = sessionId.toUpperCase();
    if (!this.sessions.has(sessionId)) {
      const session = await this.initialize(sessionId);
      if (session) {
        this.sessions.set(sessionId, session);
      } else {
        console.error(`✘ Failed to initialize session for ID: ${sessionId}`);
        return undefined;
      }
    }
    return this.sessions.get(sessionId);
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
}
