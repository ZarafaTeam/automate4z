import { Session, ProfileInfo } from "@zowe/imperative";
import { AUTH_TYPE_BASIC } from "@zowe/imperative/lib/rest/src/session/SessConstants";
import { ConfigManager } from "./configManager";

export class SessionManager {
  private static instance: SessionManager;
  private session!: Session;

  private readonly authentification = async (
    type: string,
    profil: string,
    hostname: string,
    port: number,
    user: string,
    password: string
  ): Promise<Session | undefined> => {
    if (type === "zowe") {
      const profInfo = new ProfileInfo("zowe");
      await profInfo.readProfilesFromDisk();
      // Récupérer tous les profils
      const allProfAttrs = profInfo.getAllProfiles();

      // Sélectionner un profil spécifique autre que le profil par défaut
      const profileName = profil;
      const zosmfProfAttrs = allProfAttrs.find(
        (profile) => profile.profName === profileName
      );

      if (zosmfProfAttrs) {
        const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, {
          getSecureVals: true,
        });
        return ProfileInfo.createSession(zosmfMergedArgs.knownArgs);
      } else {
        console.error(`❌ No zowe profil found for : ${profil}`);
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
        type: "basic",
        strictSSL: true,
        secureProtocol: "SSLv23_method",
        base64EncodedAuth: "YTQ4NjA0MjpvcmFuZ2UxMg==",
        $0: "",
        _: [""],
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
      console.error(`❌ Invalid authentication type ${type}`);
    }
  };

  private constructor() {
    // Constructor is now synchronous and does not perform async operations
  }

  public async initialize(): Promise<void> {
    const config = ConfigManager.getInstance().getConfig();

    try {
      if (!config) {
        throw new Error("Configuration is null or undefined");
      }

      const session = await this.authentification(
        config.zosConnexion.type,
        config.zosConnexion.profil,
        config.zosConnexion.hostname,
        config.zosConnexion.port,
        config.zosConnexion.user,
        config.zosConnexion.password
      );
      if (session) {
        this.session = session;
      } else {
        throw new Error("Session creation failed");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("❌ Error during authentication :", error.message);
      } else {
        console.error("❌ Error during authentication :", error);
      }
    }
  }

  public async getSession(): Promise<Session> {
    if (!this.session) {
      await this.initialize();
    }
    return this.session;
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
}
