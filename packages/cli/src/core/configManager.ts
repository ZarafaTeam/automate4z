import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { Config } from "../types/config";

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config | null = null;

  private constructor() {
    // Private constructor to prevent instantiation
    const configPath = path.resolve(
      __dirname,
      "../configuration/automate4z.yaml"
    );
    try {
      const fileContents = fs.readFileSync(configPath, "utf8");
      this.config = yaml.load(fileContents) as Config;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error reading config file: ${error.message}`);
      } else {
        console.error("Error reading config file: Unknown error");
      }
      this.config = null;
      process.exit(1);
    }
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): Config | null {
    return this.config;
  }
}
