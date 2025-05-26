#!/usr/bin/env node

import { Command } from "commander";
import { runWorkflow } from "./core/runner.js";
import * as path from "path";
import * as fs from "fs";
import { startServer } from "@a4z/web-server";
import open from "open";
import yaml from "js-yaml";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { Workflow } from "./types/workflow.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name("a4z")
  .description("CLI pour automatiser les tâches sur z/OS")
  .version("1.0.0");

program
  .command("init")
  .description("Initialiser un nouveau projet Automate4z")
  .action(async () => {
    try {
      const templatePath = path.resolve(__dirname, "../templates/init");
      const targetPath = process.cwd();

      if (!fs.existsSync(templatePath)) {
        console.error(
          "Erreur: Le répertoire des templates n'existe pas:",
          templatePath
        );
        process.exit(1);
      }

      // Copier les fichiers du template
      fs.cpSync(templatePath, targetPath, { recursive: true });

      console.log("✅ Projet Automate4z initialisé avec succès!");
      console.log("\nPour commencer:");
      console.log("1. Éditez le fichier workflow.yaml");
      console.log("2. Configurez vos connexions dans config.yaml");
      console.log("3. Exécutez votre workflow avec: a4z run workflow.yaml");
    } catch (error) {
      console.error("Erreur lors de l'initialisation du projet:", error);
      process.exit(1);
    }
  });

program
  .command("run")
  .description("Exécuter un workflow")
  .argument("<file>", "Fichier de workflow à exécuter")
  .option(
    "-e, --env <env>",
    "Variables d'environnement (format: KEY=VALUE,...)"
  )
  .action(async (file: string, options: { env?: string }) => {
    try {
      const envVars: Record<string, string> = {};
      if (options.env) {
        options.env.split(",").forEach((pair) => {
          const [key, value] = pair.split("=");
          if (key && value) {
            envVars[key.trim()] = value.trim();
          }
        });
      }

      const workflowPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(workflowPath)) {
        console.error(
          "Erreur: Le fichier de workflow n'existe pas:",
          workflowPath
        );
        process.exit(1);
      }

      const workflowContent = fs.readFileSync(workflowPath, "utf-8");
      const workflow = yaml.load(workflowContent) as Workflow;

      await runWorkflow(workflow, false);
    } catch (error) {
      console.error("Erreur lors de l'exécution du workflow:", error);
      process.exit(1);
    }
  });

program
  .command("doc")
  .description(
    "Afficher la documentation d'une action ou la liste des actions disponibles"
  )
  .argument("[action]", "Nom de l'action à documenter")
  .action(async (actionName: string | undefined) => {
    const actionDir = path.resolve(__dirname, "../src/steps");
    if (!actionName) {
      // Lister toutes les actions disponibles
      console.log("Actions disponibles:");
      // ... logique pour lister les actions
      return;
    }

    // Afficher la documentation d'une action spécifique
    const actionPath = path.resolve(actionDir, actionName);
    if (!fs.existsSync(actionPath)) {
      console.error("Erreur: Action non trouvée:", actionName);
      process.exit(1);
    }

    // ... logique pour afficher la documentation
  });

program
  .command("ui")
  .description("Démarrer l'interface utilisateur web")
  .option("-p, --port <port>", "Port d'écoute", "3000")
  .option("-h, --host <host>", "Hôte d'écoute", "localhost")
  .action(async (options: { port: string; host: string }) => {
    try {
      const port = parseInt(options.port, 10);
      const host = options.host;

      await startServer(port.toString());
      console.log(`✅ Interface web démarrée sur http://${host}:${port}`);
      await open(`http://${host}:${port}`);
    } catch (error) {
      console.error("Erreur lors du démarrage de l'interface web:", error);
      process.exit(1);
    }
  });

program.parse();
