import { asArray } from '@jfrazx/asarray';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

import { isString, isUndefined, isObject, determineKey } from './helpers';
import { EnvOptionsContainer } from './options/index';
import { Level, Environment } from './enums';
import {
  EnvMany,
  ResultTo,
  EnvLogger,
  EnvMutator,
  EnvOptions,
  EnvManyResult,
  EnvInitOptions,
  EnvLoadOptions,
  EnvManyOptions,
} from './interfaces';

const defaultMutator = <T = string>(value: T) => value;

export class Envirator {
  private readonly opts: EnvOptionsContainer;

  constructor(options: EnvInitOptions = {}) {
    this.opts = new EnvOptionsContainer(options);
  }

  private genFilePath(env: string, path: string | undefined): string {
    return isUndefined(path) ? `.env${env ? '.' : env}${env}` : path;
  }

  private exit(message: string, logger: EnvLogger): void {
    logger.error(message);
    process.exit(1);
  }

  /**
   * Loan an environment config
   *
   * @param {string} [path]
   * @param {EnvLoadOptions} [options]
   * @memberof Envirator
   */
  load(options?: EnvLoadOptions): void;
  load(path?: string, options?: EnvLoadOptions): void;
  load(path?: any, options: EnvLoadOptions = {}): void {
    if (isObject(path)) {
      options = path;
      path = null;
    }

    const {
      logger = this.opts.logger,
      nodeEnv = this.opts.nodeEnv,
      config = {},
    } = options;

    const env = (
      process.env[nodeEnv] ||
      (this.opts.noDefaultEnv ? '' : Environment.Development)
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
      mutators,
      defaultValue,
      logger = this.opts.logger,
      warnOnly = this.opts.warnOnly,
      productionDefaults = this.opts.productionDefaults,
    }: EnvOptions = {}
  ): T {
    const value = this.defaultEnv(key, defaultValue, productionDefaults);

    this.exitOrWarn(key, value, warnOnly, logger);

    return asArray<EnvMutator<T>>(mutators as EnvMutator).reduce(
      (memo: any, func) => func.call(null, memo),
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
  provideMany<T = EnvManyResult>(
    envars: EnvMany,
    shape: ResultTo<T> = defaultMutator
  ): T {
    return shape(
      envars.reduce((memo, envar) => {
        const {
          key = envar as string,
          keyToJsProp = this.opts.keyToJsProp,
          keyTo = defaultMutator,
        } = envar as EnvManyOptions;
        const opts: EnvOptions = isString(envar) ? {} : envar;
        const useKey = determineKey(key, keyToJsProp, keyTo);

        return {
          ...memo,
          [useKey]: this.provide(key, opts),
        };
      }, {} as T)
    );
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
    return this.currentEnv === this.opts.envs.production;
  }

  /**
   * Property that indicates if the current environment is development
   *
   * @readonly
   * @type {boolean}
   * @memberof Envirator
   */
  get isDevelopment(): boolean {
    return this.currentEnv === this.opts.envs.development;
  }

  /**
   * Property that indicates if the current environment is test
   *
   * @readonly
   * @type {boolean}
   * @memberof Envirator
   */
  get isTest(): boolean {
    return this.currentEnv === this.opts.envs.test;
  }

  /**
   * Property that indicates if the current environment is staging
   *
   * @readonly
   * @type {boolean}
   * @memberof Envirator
   */
  get isStaging(): boolean {
    return this.currentEnv === this.opts.envs.staging;
  }

  /**
   * Retrieve the current environment
   *
   * @type {string}
   * @memberof Envirator
   */
  get currentEnv(): string {
    const env = process.env[this.opts.nodeEnv];

    return isUndefined(env) && this.opts.noDefaultEnv
      ? (this.exitOrWarn(
          this.opts.nodeEnv,
          env,
          false,
          this.opts.logger
        ) as any)
      : (env || this.opts.envs.development).toLowerCase().trim();
  }

  set currentEnv(env: string) {
    this.setEnv(this.opts.nodeEnv, env);
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

export { Environment } from './enums';
export * from './interfaces';
export const Env = Envirator;
