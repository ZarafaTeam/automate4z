export class Context {
  private env: Record<string, any> = {};
  private outputs: Record<string, any> = {};

  constructor(initialEnv: Record<string, any> = {}) {
    this.env = { ...initialEnv };
  }

  resolve(value: any): any {
    if (typeof value === "string") {
      return value.replace(/{{\s*(.*?)\s*}}/g, (_, expr) => {
        try {
          const fn = new Function("env", `return ${expr}`);
          return fn(this.env);
        } catch (e) {
          console.warn(`⚠️ Failed to resolve expression: {{ ${expr} }}`);
          return "";
        }
      });
    }
    return value;
  }

  setEnv(key: string, value: any) {
    this.env[key] = value;
  }

  setOutput(stepName: string, result: any) {
    if (!result) return;
    for (const [key, value] of Object.entries(result)) {
      const fullKey = `${stepName}.${key}`;
      this.env[fullKey] = value;
      this.outputs[fullKey] = value;
    }
  }

  getEnv(key: string): any {
    return this.env[key];
  }

  getEnvObject(): Record<string, any> {
    return { ...this.env };
  }
}
