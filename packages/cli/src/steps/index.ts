import * as localEval from "./local/eval.js";
import * as localLog from "./local/log.js";
import * as localSay from "./local/say.js";
import * as localShout from "./local/shout.js";
import * as localCollect from "./local/collect.js";
import * as localFileCopy from "./local.file/copy.js";
import * as zosFileCopyPS from "./zos.file/copyps.js";
import * as controlForEach from "./control/for-each.js";
import { StepHandler } from "../types/step.js";

export type HandlerMap = {
  "local.eval": StepHandler<{ expression: string }, { result: unknown }>;
  "local.log": StepHandler<{ message: string }, { message: string }>;
  "local.say": StepHandler<{ name: string }, { message: string }>;
  "local.shout": StepHandler<{ word: string }, { shouted: string }>;
  "local.collect": StepHandler<
    { source: string; pattern: string },
    { result: unknown[] }
  >;
  "local.file.copy": StepHandler<{ source: string; destination: string }>;
  "zos.file.copyps": StepHandler<{ source: string; destination: string }>;
  "control.for-each": StepHandler<
    {
      items: unknown[];
      steps: Array<{
        name: string;
        action: string;
        with?: Record<string, unknown>;
      }>;
    },
    { loopCount: number }
  >;
};

const handlers = {
  "local.eval": localEval,
  "local.log": localLog,
  "local.say": localSay,
  "local.shout": localShout,
  "local.collect": localCollect,
  "local.file.copy": localFileCopy,
  "zos.file.copyps": zosFileCopyPS,
  "control.for-each": controlForEach,
} as unknown as HandlerMap;

export function getStepHandler<K extends keyof HandlerMap>(
  action: K
): HandlerMap[K] | undefined {
  return handlers[action];
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
            if (name in handlers) {
              console.warn(
                `⚠️ Step "${name}" already registered. Skipping plugin version.`
              );
              continue;
            }
            (handlers as unknown as Record<string, unknown>)[name] = handler;
          }
        }
      } catch (err) {
        console.error(`❌ Failed to load plugin "${pluginName}":`, err);
      }
    }
  } catch (error) {
    console.warn(
      `No plugins defined in package.json under a4z.plugins ${error}`
    );
  }
}
