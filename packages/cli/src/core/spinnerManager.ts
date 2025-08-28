import ora from "ora";
import chalk from "chalk";

const spinner = ora();

export class Spinner {
  static start(text: string): void {
    spinner.start(text);
  }

  static stop(): void {
    spinner.stop();
  }

  static succeed(text: string): void {
    spinner.succeed(chalk.green(text));
  }

  static fail(text: string): void {
    spinner.fail(chalk.red(text));
  }

  static warn(text: string): void {
    spinner.warn(chalk.yellow(text));
  }

  static log(text: string): void {
    spinner.stop();
    console.log(text);
  }

  static debug(text: string): void {
    spinner.stop();
    console.debug(chalk.gray(text));
  }

  static error(text: string): void {
    spinner.stop();
    console.error(chalk.red(text));
  }
}
