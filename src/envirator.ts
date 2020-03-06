import { asArray } from '@jfrazx/asarray';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

import { isString, isUndefined, isObject, toJsProperty } from './helpers';
import { EnvLoadOptions } from './interfaces/env-load-options.interface';
import { Default, Level } from './enums';
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
  readonly noDefaultEnv: boolean;
  readonly keyToJsProp: boolean;
  readonly logger: EnvLogger;
  readonly warnOnly: boolean;
  readonly nodeEnv: string;

  constructor({
    productionDefaults = false,
    nodeEnv = Default.NodeEnv,
    noDefaultEnv = false,
    keyToJsProp = false,
    logger = console,
    warnOnly = false,
  }: EnvInitOptions = {}) {
    this.logger = logger;
    this.nodeEnv = nodeEnv;
    this.warnOnly = warnOnly;
    this.keyToJsProp = keyToJsProp;
    this.noDefaultEnv = noDefaultEnv;
    this.productionDefaults = productionDefaults;
  }

  private genFilePath(env: string, path: string | undefined): string {
    return isUndefined(path) ? `.env${env ? '.' : env}${env}` : path;
  }

  private exit(message: string, logger: EnvLogger): void {
    logger.error(message);
    process.exit(1);
  }

  load(options?: EnvLoadOptions): void;
  load(path?: string): void;
  load(path?: any, options: EnvLoadOptions = {}): void {
    if (isObject(path)) {
      options = path;
      path = null;
    }

    const {
      logger = this.logger,
      nodeEnv = this.nodeEnv,
      config = {},
    } = options;

    const env = (
      process.env[nodeEnv] || (this.noDefaultEnv ? '' : Default.Development)
    ).toLowerCase();

    path = this.genFilePath(env, path || config.path);
    const envResult = dotenv.config({ ...config, path });

    if (envResult.error) {
      this.exit(
        chalk.red(
          `[ENV ${Level.Error}] failed to load '${path}': ${envResult.error}`
        ),
        logger
      );
    }
  }

  /**
   * Retrieve an environment variable
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
      productionDefaults = this.productionDefaults,
      logger = this.logger,
      warnOnly = this.warnOnly,
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
      const {
        key = envar as string,
        keyToJsProp = this.keyToJsProp,
      } = envar as EnvManyOptions;
      const opts: EnvOptions = isString(envar) ? {} : envar;
      const useKey = keyToJsProp ? toJsProperty(key) : key;

      return {
        ...memo,
        [useKey]: this.provide(key, opts),
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
    return this.currentEnv === Default.Production;
  }

  /**
   * Retrieve the current environment
   *
   * @type {string}
   * @memberof Envirator
   */
  get currentEnv(): string {
    const env = process.env[this.nodeEnv];

    return isUndefined(env) && this.noDefaultEnv
      ? (this.exitOrWarn(this.nodeEnv, env, false, this.logger) as any)
      : (env || Default.Development).toLowerCase();
  }

  set currentEnv(env: string) {
    this.setEnv(this.nodeEnv, env);
  }

  /**
   *
   *
   * @private
   * @param {string} key
   * @param {(string | undefined)} value
   * @param {boolean} warnOnly
   * @param {EnvLogger} logger
   * @returns {void}
   * @memberof Envirator
   */
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
        return this.exit(chalk.red(message.replace(level, 'ERROR')), logger);
      }

      logger.warn(chalk.yellow(message.replace(level, Level.Warn)));
    }
  }

  private shouldExit(warnOnly: boolean): boolean {
    return !warnOnly || this.isProduction;
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
