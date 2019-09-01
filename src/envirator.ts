import { asArray } from '@jfrazx/asarray';
import chalk from 'chalk';

import { EnvOptions, EnvLogger, EnvInitOptions } from './interfaces';
import { isString, isUndefined } from './helpers';

export class Envirator implements EnvInitOptions {
  readonly productionDefaults: boolean;
  readonly logger: EnvLogger;
  readonly warnOnly: boolean;

  constructor({
    logger = console,
    warnOnly = false,
    productionDefaults = false,
  }: EnvInitOptions = {}) {
    this.logger = logger;
    this.warnOnly = warnOnly;
    this.productionDefaults = productionDefaults;
  }

  static async load(path?: string, logger: EnvLogger = console): Promise<void> {
    const env = process.env.NODE_ENV || 'development';
    const dotenv = await import('dotenv');

    path = path === undefined ? `.env.${env}` : path;
    const envResult = dotenv.config({ path });

    if (envResult.error) {
      this.exit(
        chalk.red(`'[ERROR] env failed to load:' ${envResult.error}`),
        logger
      );
    }
  }

  private static exit(message: string, logger: EnvLogger): void {
    logger.error(message);
    process.exit(1);
  }

  async load(path?: string): Promise<void> {
    return await Envirator.load(path, this.logger);
  }

  private defaultEnv(
    key: string,
    defaultValue: any,
    productionDefaults: boolean
  ): string | undefined {
    const value = process.env[key];

    return !isUndefined(value) ||
      this.shouldNotProvideProductionDefaults(productionDefaults)
      ? value
      : defaultValue;
  }

  private shouldNotProvideProductionDefaults(
    productionDefaults: boolean
  ): boolean {
    return !productionDefaults && this.isProduction();
  }

  /**
   *
   *
   * @template T
   * @param {string} key
   * @param {EnvOptions} [{
   *       defaulValue,
   *       mutators,
   *       logger = this.logger,
   *       warnOnly = this.warnOnly,
   *       productionDefaults = this.productionDefaults,
   *     }={}]
   * @returns {T}
   * @memberof Envirator
   */
  provide<T = string>(
    key: string,
    {
      defaultValue,
      mutators,
      logger = this.logger,
      warnOnly = this.warnOnly,
      productionDefaults = this.productionDefaults,
    }: EnvOptions = {}
  ): T {
    const value = this.defaultEnv(key, defaultValue, productionDefaults);

    this.exitOrWarn(key, value, warnOnly, logger);

    return asArray<any>(mutators).reduce(
      (memo: any, func: Function) => func.call(null, memo),
      value
    ) as T;
  }

  setEnv(key: string, value: any): void;
  setEnv(enVars: { [key: string]: any }): void;
  setEnv(env: any, enValue?: any): void {
    if (isString(env)) {
      env = { [env]: enValue };
    }

    Object.entries(env).forEach(([key, value]) => {
      process.env[key] = String(value);
    });
  }

  private exitOrWarn(
    key: string,
    value: string | undefined,
    warnOnly: boolean,
    logger: EnvLogger
  ): void {
    if (isUndefined(value)) {
      const level = '%level%';
      const message = `[ENV ${level}]: Missing environment variable '${key}'`;

      if (this.shouldExit(warnOnly)) {
        return Envirator.exit(
          chalk.red(message.replace(level, 'ERROR')),
          logger
        );
      }

      logger.warn(chalk.yellow(message.replace(level, 'WARN')));
    }
  }

  private shouldExit(warnOnly: boolean): boolean {
    return this.isProduction() || !warnOnly;
  }

  private isProduction(): boolean {
    return (
      (process.env.NODE_ENV || 'development').toLowerCase() === 'production'
    );
  }
}
