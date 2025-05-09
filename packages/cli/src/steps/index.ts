import * as localLog from "./local/log.js";
import * as localEval from "./local/eval.js";
import * as localCollect from "./local/collect.js";
import * as localSay from "./local/say.js";
import * as localShout from "./local/shout.js";
import * as controlForEach from "./control/for-each.js";
import * as localFileCopy from "./local.file/copy.js";
import * as zosFileCopyPS from "./zos.file/copyps.js";

const registry: Record<string, any> = {
  "local.log": localLog,
  "local.eval": localEval,
  "local.collect": localCollect,
  "local.say": localSay,
  "local.shout": localShout,
  "control.for-each": controlForEach,
  "local.file.copy": localFileCopy,
  "zos.file.copyps": zosFileCopyPS,
  // Add more steps here as needed
};

export function getStepHandler(action: string) {
  const handler = registry[action];
  if (!handler) throw new Error(`Unknown action: ${action}`);
  return handler;
}

export async function loadPlugins(): Promise<void> {
  try {
    const pkg = await import("../../package.json", {
      assert: { type: "json" },
    });
    const plugins: string[] = pkg.default?.a4z?.plugins ?? [];

    for (const pluginName of plugins) {
      try {
        const plugin = await import(pluginName);
        const pluginSteps = plugin.steps;
        if (pluginSteps && typeof pluginSteps === "object") {
          for (const [name, handler] of Object.entries(pluginSteps)) {
            if (name in registry) {
              console.warn(
                `⚠️ Step "${name}" already registered. Skipping plugin version.`
              );
              continue;
            }
            registry[name] = handler;
          }
        }
      } catch (err) {
        console.error(`❌ Failed to load plugin "${pluginName}":`, err);
      }
    }
  } catch (e) {
    console.warn("No plugins defined in package.json under a4z.plugins");
  }
}
