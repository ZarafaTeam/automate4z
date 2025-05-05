#!/usr/bin/env node
import { Command } from "commander";
import { runWorkflow } from "./core/runner.js";
import * as path from "path";
import * as fs from "fs";
import * as unzipper from "unzipper";
import * as https from "https";
import { startServer } from "@a4z/web-server";
import open from "open";

const program = new Command();

program
  .name("a4z")
  .description(
    "Automation CLI for mainframe and local tasks, driven by YAML workflows"
  )
  .version("0.1.0");

// run workflow
program
  .command("run")
  .description("Exécute un workflow YAML")
  .argument("<workflow>", "Chemin vers le fichier YAML")
  .option(
    "--env <keyValue...>",
    "Variables d’environnement à injecter",
    (value, previous: Record<string, string>) => {
      const [key, val] = value.split("=");
      previous[key] = val;
      return previous;
    },
    {}
  )
  .action(async (workflow, options) => {
    await runWorkflow(workflow, options.env);
  });

// add-plugin
program
  .command("add-plugin")
  .description("Ajoute un plugin externe via un fichier zip local ou une URL")
  .argument("<source>", "Chemin vers un fichier zip ou URL http(s)")
  .action(async (source) => {
    const pluginsDir = path.resolve("a4z_plugins");
    fs.mkdirSync(pluginsDir, { recursive: true });

    const tmpZipPath = path.resolve("a4z_plugins/tmp_plugin.zip");

    if (source.startsWith("http")) {
      const file = fs.createWriteStream(tmpZipPath);
      console.log(`⬇️  Téléchargement du plugin depuis ${source}...`);
      await new Promise((resolve, reject) => {
        https
          .get(source, (response) => {
            if (response.statusCode !== 200) {
              reject(new Error(`Erreur HTTP ${response.statusCode}`));
            }
            response.pipe(file);
            file.on("finish", () => file.close(resolve));
          })
          .on("error", reject);
      });
    } else {
      if (!fs.existsSync(source)) {
        console.error(`❌ Fichier introuvable : ${source}`);
        process.exit(1);
      }
      fs.copyFileSync(source, tmpZipPath);
    }

    const zip = fs
      .createReadStream(tmpZipPath)
      .pipe(unzipper.Extract({ path: pluginsDir }));
    await new Promise((resolve, reject) => {
      zip.on("close", resolve);
      zip.on("error", reject);
    });

    fs.unlinkSync(tmpZipPath);

    const extractedDirs = fs
      .readdirSync(pluginsDir, { withFileTypes: true })
      .filter((f) => f.isDirectory());
    const lastExtractedPath = path.resolve(
      pluginsDir,
      extractedDirs[extractedDirs.length - 1].name
    );
    const pluginPkg = path.join(lastExtractedPath, "package.json");
    if (fs.existsSync(pluginPkg)) {
      console.log("📦 Dépendances détectées. Installation avec npm install...");
      const { execSync } = await import("child_process");
      try {
        execSync("npm install", { cwd: lastExtractedPath, stdio: "inherit" });
      } catch (err) {
        console.warn(
          "⚠️ Échec de npm install. Le plugin risque de ne pas fonctionner correctement."
        );
      }
    }

    const newPluginPath =
      "./a4z_plugins/" + extractedDirs[extractedDirs.length - 1].name;
    const pkgPath = path.resolve("package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    pkg.a4z = pkg.a4z || {};
    pkg.a4z.plugins = pkg.a4z.plugins || [];

    if (!pkg.a4z.plugins.includes(newPluginPath)) {
      pkg.a4z.plugins.push(newPluginPath);
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }

    console.log(`✅ Plugin ajouté et référencé depuis ${newPluginPath}`);
  });

// list-plugins
program
  .command("list-plugins")
  .description("Liste les plugins installés")
  .action(() => {
    const pkgPath = path.resolve("package.json");
    if (!fs.existsSync(pkgPath)) {
      console.error("❌ package.json introuvable");
      process.exit(1);
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const plugins = pkg.a4z?.plugins ?? [];
    if (plugins.length === 0) {
      console.log("📦 Aucun plugin installé.");
    } else {
      console.log("📦 Plugins installés :");
      for (const plugin of plugins) {
        console.log(" -", plugin);
      }
    }
  });

// remove-plugin
program
  .command("remove-plugin")
  .description("Supprime un plugin installé localement")
  .argument(
    "<name>",
    "Nom du plugin à supprimer (chemin relatif dans a4z_plugins)"
  )
  .action((name) => {
    const pluginPath = "./a4z_plugins/" + name;
    const fullPluginPath = path.resolve(pluginPath);
    const pkgPath = path.resolve("package.json");

    if (!fs.existsSync(pkgPath)) {
      console.error("❌ package.json introuvable");
      process.exit(1);
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    pkg.a4z = pkg.a4z || {};
    pkg.a4z.plugins = (pkg.a4z.plugins || []).filter(
      (p: string) => p !== pluginPath
    );
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    if (fs.existsSync(fullPluginPath)) {
      fs.rmSync(fullPluginPath, { recursive: true, force: true });
      console.log(`🗑️  Plugin supprimé : ${pluginPath}`);
    } else {
      console.warn(`⚠️  Plugin non trouvé sur disque : ${pluginPath}`);
    }
  });

program
  .command("ui")
  .description("Lancer l’UI Web pour construire et exécuter des workflows")
  .option("--dir <path>", "Répertoire des workflows", process.cwd())
  .action(async (opts) => {
    await startServer(opts.dir);
    open("http://localhost:3000");
  });

program.parse();
