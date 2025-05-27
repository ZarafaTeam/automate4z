import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import enquirer from "enquirer";
import keytar from "keytar";

const CONFIG_PATH = path.resolve("dist/configuration/automate4z.yaml");

type ConfigEntry = {
  name: string;
  type: "zowe" | "basic";
  profile?: string;
  hostname?: string;
  port?: number;
  user?: string;
  password?: string;
};

type ConfigSettings = {
  name: string;
  type: "zowe" | "basic";
  profile?: string;
  hostname?: string;
  port?: number;
};

type Config = {
  defaultZosConnection?: string;
  zosConnection: ConfigSettings[];
};

function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`❌ Fichier de configuration introuvable : ${CONFIG_PATH}`);
    process.exit(1);
  }

  try {
    const configContent = fs.readFileSync(CONFIG_PATH, "utf-8");
    const configData = yaml.load(configContent) as Config;
    return configData;
  } catch (err) {
    console.error(
      `⚠️ Erreur lors de la lecture du fichier de configuration :`,
      err
    );
    process.exit(1);
  }
}

function saveConfig(config: Config) {
  try {
    const yamlContent = yaml.dump(config);
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, yamlContent, "utf-8");
  } catch (err) {
    console.error(
      `⚠️ Erreur lors de l'écriture du fichier de configuration :`,
      err
    );
    process.exit(1);
  }
}

async function addConnection(config: Config) {
  const { name, type } = await enquirer.prompt<{ name: string; type: string }>([
    {
      type: "input",
      name: "name",
      message: "Nom de la configuration (ex: SDEV)",
    },
    {
      type: "select",
      name: "type",
      message: "Type de connexion",
      choices: ["zowe", "basic"],
    },
  ]);

  const entry: ConfigEntry = {
    name: name.toUpperCase(),
    type: type as "zowe" | "basic",
  };

  if (type === "zowe") {
    const { profile } = await enquirer.prompt<{ profile: string }>({
      type: "input",
      name: "profile",
      message: "Nom du profil Zowe",
    });
    entry.profile = profile;
  } else {
    const answers = await enquirer.prompt<{
      hostname: string;
      port: number;
      user: string;
      password: string;
    }>([
      { type: "input", name: "hostname", message: "Hostname" },
      { type: "numeral", name: "port", message: "Port" },
      { type: "input", name: "user", message: "Utilisateur" },
      { type: "password", name: "password", message: "Mot de passe" },
    ]);
    Object.assign(entry, answers);
  }
  if (!config.zosConnection) {
    config.zosConnection = [];
  }
  const setting: ConfigSettings = {
    name: entry.name,
    type: entry.type,
    profile: entry.profile,
    hostname: entry.hostname,
    port: entry.port,
  };
  config.zosConnection.push(setting);
  saveConfig(config);
  let key: string;
  let value: string;
  key = `${entry.name.toUpperCase()}_USER`;
  value = entry.user ?? "";
  await keytar.setPassword("automate4z", key, value);
  key = `${entry.name.toUpperCase()}_PWD`;
  value = entry.password ?? "";
  await keytar.setPassword("automate4z", key, value);
}

async function removeConnection(config: Config) {
  if (config.zosConnection.length === 0) {
    console.log("Aucune configuration à supprimer.");
    return;
  }

  const { name } = await enquirer.prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: "Sélectionner une configuration à supprimer",
    choices: config.zosConnection.map((c) => c.name),
  });

  if (config.defaultZosConnection === name) {
    config.defaultZosConnection = undefined; // on supprime la valeur par défaut si c'est la connexion supprimée
  }
  config.zosConnection = config.zosConnection.filter((c) => c.name !== name);
  saveConfig(config);
  // Suppression des mots de passe et utilisateur associés si type basic
  await keytar
    .deletePassword("automate4z", `${name.toUpperCase()}_USER`)
    .catch((err) => {
      console.log("Erreur lors de la suppression de l'utilisateur :", err);
    });
  await keytar
    .deletePassword("automate4z", `${name.toUpperCase()}_PWD`)
    .catch((err) => {
      console.log("Erreur lors de la suppression du mot de passe :", err);
    });
}

async function setDefaultConnection(config: Config) {
  if (config.zosConnection.length === 0) {
    console.log("Aucune configuration disponible.");
    return;
  }

  const { name } = await enquirer.prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: "Choisir la connexion par défaut",
    //initial: config.defaultZosConnection,
    choices: config.zosConnection.map((c) => c.name),
  });

  config.defaultZosConnection = name;
  saveConfig(config);
}

async function editConnection(config: Config) {
  if (config.zosConnection.length === 0) {
    console.log("Aucune configuration à modifier.");
    return;
  }

  const { name } = await enquirer.prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: "Sélectionner une configuration à modifier",
    choices: config.zosConnection.map((c) => c.name),
  });

  const existing = config.zosConnection.find((c) => c.name === name);
  if (!existing) return;

  const { newName, newType } = await enquirer.prompt<{
    newName: string;
    newType: string;
  }>([
    {
      type: "input",
      name: "newName",
      message: "Nom de la configuration",
      initial: existing.name,
    },
    {
      type: "select",
      name: "newType",
      message: "Type de connexion",
      choices: [
        { name: "zowe", value: "zowe" },
        { name: "basic", value: "basic" },
      ],
    },
  ]);

  const updated: ConfigEntry = {
    name: newName,
    type: newType as "zowe" | "basic",
  };

  if (newType === "zowe") {
    const { profile } = await enquirer.prompt<{ profile: string }>({
      type: "input",
      name: "profile",
      message: "Nom du profil Zowe",
      initial: existing.profile || "",
    });
    updated.profile = profile;
  } else {
    const user = await keytar.getPassword(
      "automate4z",
      `${updated.name.toUpperCase()}_USER`
    );
    const answers = await enquirer.prompt<{
      hostname: string;
      port: number;
      user: string;
      password: string;
    }>([
      {
        type: "input",
        name: "hostname",
        message: "Hostname",
        initial: existing.hostname,
      },
      {
        type: "numeral",
        name: "port",
        message: "Port",
        initial: existing.port,
      },
      { type: "input", name: "user", message: "Utilisateur", initial: user },
      {
        type: "password",
        name: "password",
        message:
          "Mot de passe (laisser vide pour ne pas changer si déjà existant)",
      },
    ]);

    const password =
      (await keytar.getPassword(
        "automate4z",
        `${updated.name.toUpperCase()}_PWD`
      )) || "";

    Object.assign(updated, answers);
    if (!answers.password) {
      //updated.password = existing.password; // on garde l’ancien si vide
      updated.password = password; // on garde l’ancien si vide
    }
  }
  const setting: ConfigSettings = {
    name: updated.name,
    type: updated.type,
    profile: updated.profile,
    hostname: updated.hostname,
    port: updated.port,
  };
  // Remplacement de la connexion dans la config
  const index = config.zosConnection.findIndex((c) => c.name === name);
  config.zosConnection[index] = setting;
  saveConfig(config);
  // si nouvelle connexion de type basic, on ajoute à keytar le user et le mot de passe
  if (updated.type === "basic") {
    await keytar.setPassword(
      "automate4z",
      `${updated.name.toUpperCase()}_USER`,
      updated.user ?? ""
    );
    if (updated.password) {
      await keytar.setPassword(
        "automate4z",
        `${updated.name.toUpperCase()}_PWD`,
        updated.password ?? ""
      );
    }
  }
  //si nom de la nouvelle connexion différent de l'ancienne ou si type de la nouvelle connexion est zowe et type de l'ancienne est basic, on supprime les anciens mots de passe et user
  if (
    name !== updated.name ||
    (updated.type === "zowe" && existing.type === "basic")
  ) {
    await keytar
      .deletePassword("automate4z", `${name.toUpperCase()}_USER`)
      .catch((err) => {
        console.log("Erreur lors de la suppression de l'utilisateur :", err);
      });
    await keytar
      .deletePassword("automate4z", `${name.toUpperCase()}_PWD`)
      .catch((err) => {
        console.log("Erreur lors de la suppression du mot de passe :", err);
      });
  }
  //affichage de la liste password dans keytar
  //const allEntries = await keytar.findCredentials("automate4z");
  //console.log('Liste des mots de passe dans keytar :');
  //allEntries.forEach((entry) => {
  //  console.log(`  - ${entry.account}: ${entry.password}`);
  //});
}

export async function initCLI() {
  const config = loadConfig();

  const { action } = await enquirer.prompt<{ action: string }>({
    type: "select",
    name: "action",
    message: "Que voulez-vous faire ?",
    choices: [
      { name: "add", message: "Ajouter une connexion" },
      { name: "edit", message: "Modifier une connexion" },
      { name: "remove", message: "Supprimer une connexion" },
      { name: "setDefault", message: "Définir la connexion par défaut" },
      { name: "exit", message: "Quitter" },
    ],
  });

  if (action === "add") {
    await addConnection(config);
    console.log(" ");
    await initCLI();
  } else if (action === "edit") {
    await editConnection(config);
    console.log(" ");
    await initCLI();
  } else if (action === "remove") {
    await removeConnection(config);
    console.log(" ");
    await initCLI();
  } else if (action === "setDefault") {
    await setDefaultConnection(config);
    console.log(" ");
    await initCLI();
  } else {
    console.log("Sortie.");
  }
}
