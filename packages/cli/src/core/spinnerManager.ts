import { info } from "console";
import ora, { Ora } from "ora";
import chalk from "chalk";


class SpinnerManager {
  private static instance: SpinnerManager;
  private spinner: Ora | null = null;
  private enableDebug = false;
  private logBuffer: string[] = [];

  private constructor() {}

  public static getInstance(): SpinnerManager {
    if (!SpinnerManager.instance) {
      SpinnerManager.instance = new SpinnerManager();
    }
    return SpinnerManager.instance;
  }

  public setDebug(enabled : boolean): void {
    this.enableDebug = enabled;
  }

  public debug(message: string): void {
    if (this.enableDebug) {
      this.logBuffer.push("  " + "🪲  " + chalk.magenta(message));
    }
  }

  public log(message: string): void {
      this.logBuffer.push("  " + message);
  }

  public error(message: string): void {
      this.logBuffer.push(chalk.red("  " + message));
  }

  private flushLogs(): void {
    for (const msg of this.logBuffer) {
      console.log(msg);
    }
    this.logBuffer = [];
  }

  private pause(callback: () => void): void {
    const currentText = this.spinner?.text;
    const wasSpinning = this.spinner?.isSpinning;
    if (wasSpinning) {
      this.spinner?.stop();
    }
    callback();
    if (wasSpinning && currentText) {
      this.spinner = ora(currentText).start();
    }
  }

  public start(text: string): void {
    if (!this.spinner) {
      this.spinner = ora(text).start();
    } else {
      this.spinner.text = text;

      if (!this.spinner.isSpinning) {
        this.spinner.start();
      }
    }
  }

  public succeed(text?: string): void {
    this.spinner?.succeed(chalk.greenBright(text));
    this.flushLogs();
    this.spinner = null;
  }

  public fail(text?: string): void {
    this.spinner?.fail(chalk.red(text));
    this.flushLogs();
    this.spinner = null;
  }

  public stop(): void {
    this.spinner?.stop();
    this.spinner = null;
  }

  public info(text: string): void {
    this.spinner?.info(text);
  }
  
  public warn(text: string): void {
    this.spinner?.warn(text);
  }
  
  public updateText(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }
}

export const Spinner = SpinnerManager.getInstance();