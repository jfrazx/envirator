import { asArray } from '@jfrazx/asarray';
import chalk from 'chalk';

import { isString, isUndefined } from './helpers';
import {
  EnvMany,
  EnvLogger,
  EnvMutator,
  EnvOptions,
  EnvManyResult,
  EnvInitOptions,
  EnvManyOptions,
} from './interfaces';

export class Envirator implements EnvInitOptions {
  readonly productionDefaults: boolean;
  readonly logger: EnvLogger;
  readonly warnOnly: boolean;
  readonly nodeEnv: string;

  constructor({
    logger = console,
    warnOnly = false,
    productionDefaults = false,
    nodeEnv = 'NODE_ENV',
  }: EnvInitOptions = {}) {
    this.logger = logger;
    this.nodeEnv = nodeEnv;
    this.warnOnly = warnOnly;
    this.productionDefaults = productionDefaults;
  }

  static async load(
    path?: string,
    { logger = console, nodeEnv = 'NODE_ENV' }: EnvInitOptions = {}
  ): Promise<void> {
    const env = process.env[nodeEnv] || 'development';
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
    return await Envirator.load(path, {
      logger: this.logger,
      nodeEnv: this.nodeEnv,
    });
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

    return asArray<EnvMutator<T>>(mutators as EnvMutator).reduce(
      (memo: any, func: EnvMutator<T>) => func.call(null, memo),
      value
    ) as T;
  }

  /**
   * Provide many environment variables at once
   *
   * @param {EnvMany} envars
   * @returns {EnvManyResult}
   * @memberof Envirator
   */
  provideMany(envars: EnvMany): EnvManyResult {
    return envars.reduce((memo, envar) => {
      const { key = envar as string } = envar as EnvManyOptions;
      const opts: EnvOptions = isString(envar) ? {} : envar;

      return {
        ...memo,
        [key]: this.provide(key, opts),
      };
    }, {});
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

  /**
   * Property that indicates if the current environment is production
   *
   * @readonly
   * @type {boolean}
   * @memberof Envirator
   */
  get isProduction(): boolean {
    return (
      (process.env[this.nodeEnv] || 'development').toLowerCase() ===
      'production'
    );
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
    return this.isProduction || !warnOnly;
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
    return !productionDefaults && this.isProduction;
  }
}
