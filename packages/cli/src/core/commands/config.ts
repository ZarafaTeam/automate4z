import { Command } from "commander";
import { ConfigManager } from "../configManager.js";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configSchema = z.object({
  appName: z.string(),
  version: z.string(),
  defaultZosConnection: z.string(),
  zosConnection: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      hostname: z.string(),
      port: z.number(),
    })
  ),
});

type Config = z.infer<typeof configSchema>;

export function initCLI(): void {
  const program = new Command();

  program
    .name("a4z")
    .description("CLI pour automatiser les tâches sur z/OS")
    .version("1.0.0");

  program
    .command("config")
    .description("Gérer la configuration")
    .action(showConfig);

  program
    .command("config:init")
    .description("Initialiser la configuration")
    .action(initConfig);

  program
    .command("config:set")
    .description("Définir une valeur de configuration")
    .argument("<key>", "Clé de configuration")
    .argument("<value>", "Valeur de configuration")
    .action(setConfig);

  program
    .command("config:get")
    .description("Obtenir une valeur de configuration")
    .argument("<key>", "Clé de configuration")
    .action(getConfig);

  program
    .command("config:delete")
    .description("Supprimer une valeur de configuration")
    .argument("<key>", "Clé de configuration")
    .action(deleteConfig);

  program.parse();
}

async function showConfig(): Promise<void> {
  try {
    const config = ConfigManager.getInstance().getConfig();
    console.log("Configuration actuelle :");
    console.log(yaml.dump(config));
  } catch (error) {
    console.error("Erreur lors de l'affichage de la configuration :", error);
    process.exit(1);
  }
}

async function initConfig(): Promise<void> {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/config/config.yaml"
    );
    const targetPath = path.resolve(process.cwd(), "config.yaml");

    if (fs.existsSync(targetPath)) {
      console.error("Le fichier de configuration existe déjà !");
      process.exit(1);
    }

    if (!fs.existsSync(templatePath)) {
      console.error("Le template de configuration est introuvable !");
      process.exit(1);
    }

    fs.copyFileSync(templatePath, targetPath);
    console.log("✅ Configuration initialisée avec succès !");
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation de la configuration :",
      error
    );
    process.exit(1);
  }
}

async function setConfig(key: string, value: string): Promise<void> {
  try {
    const configPath = path.resolve(process.cwd(), "config.yaml");
    if (!fs.existsSync(configPath)) {
      console.error("Le fichier de configuration n'existe pas !");
      process.exit(1);
    }

    const configContent = fs.readFileSync(configPath, "utf-8");
    const config = yaml.load(configContent) as Config;

    // Mettre à jour la valeur
    const keys = key.split(".");
    let current: Record<string, unknown> = config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;

    // Valider la configuration
    const result = configSchema.safeParse(config);
    if (!result.success) {
      console.error("Configuration invalide :", result.error);
      process.exit(1);
    }

    // Sauvegarder la configuration
    fs.writeFileSync(configPath, yaml.dump(config));
    console.log(`✅ Configuration mise à jour : ${key} = ${value}`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la configuration :", error);
    process.exit(1);
  }
}

async function getConfig(key: string): Promise<void> {
  try {
    const configPath = path.resolve(process.cwd(), "config.yaml");
    if (!fs.existsSync(configPath)) {
      console.error("Le fichier de configuration n'existe pas !");
      process.exit(1);
    }

    const configContent = fs.readFileSync(configPath, "utf-8");
    const config = yaml.load(configContent) as Config;

    // Récupérer la valeur
    const keys = key.split(".");
    let current: Record<string, unknown> = config;
    for (const k of keys) {
      if (!(k in current)) {
        console.error(`Clé de configuration introuvable : ${key}`);
        process.exit(1);
      }
      current = current[k] as Record<string, unknown>;
    }

    console.log(`${key} = ${current}`);
  } catch (error) {
    console.error("Erreur lors de la lecture de la configuration :", error);
    process.exit(1);
  }
}

async function deleteConfig(key: string): Promise<void> {
  try {
    const configPath = path.resolve(process.cwd(), "config.yaml");
    if (!fs.existsSync(configPath)) {
      console.error("Le fichier de configuration n'existe pas !");
      process.exit(1);
    }

    const configContent = fs.readFileSync(configPath, "utf-8");
    const config = yaml.load(configContent) as Config;

    // Supprimer la valeur
    const keys = key.split(".");
    let current: Record<string, unknown> = config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        console.error(`Clé de configuration introuvable : ${key}`);
        process.exit(1);
      }
      current = current[keys[i]] as Record<string, unknown>;
    }

    if (!(keys[keys.length - 1] in current)) {
      console.error(`Clé de configuration introuvable : ${key}`);
      process.exit(1);
    }

    delete current[keys[keys.length - 1]];

    // Valider la configuration
    const result = configSchema.safeParse(config);
    if (!result.success) {
      console.error("Configuration invalide :", result.error);
      process.exit(1);
    }

    // Sauvegarder la configuration
    fs.writeFileSync(configPath, yaml.dump(config));
    console.log(`✅ Configuration supprimée : ${key}`);
  } catch (error) {
    console.error("Erreur lors de la suppression de la configuration :", error);
    process.exit(1);
  }
}
