import { EnvOptionsContainer } from '../options';
import { Determinative } from '../determinative';
import { asArray } from '@jfrazx/asarray';
import * as dotenv from 'dotenv';
import { Level } from '../enums';
import chalk from 'chalk';
import {
  isObject,
  isString,
  toLowerCase,
  isUndefined,
  isEmptyString,
} from '../helpers';
import type {
  EnvMany,
  ResultTo,
  EnvLogger,
  EnvOptions,
  EnvManyResult,
  EnvInitOptions,
  EnvLoadOptions,
  EnvManyOptions,
} from '../interfaces';

const defaultMutator = <T = string>(value: T) => value;

export class Envirator {
  protected readonly options: EnvOptionsContainer;
  protected readonly determine: Determinative;

  constructor(options: EnvInitOptions = {}) {
    this.options = new EnvOptionsContainer(options);
    this.determine = new Determinative(this, this.options);
  }

  protected exit(message: string, logger: EnvLogger): never {
    logger.error(message);
    process.exit(1);
  }

  /**
   * Load an environment config
   *
   * @param {string} [path]
   * @param {EnvLoadOptions} [options]
   * @memberof Envirator
   */
  load(options?: EnvLoadOptions): void;
  load(path?: string, options?: EnvLoadOptions): void;
  load(path?: any, options: EnvLoadOptions = {}): void {
    if (isObject(path)) {
      options = path as EnvLoadOptions;
      path = null;
    }

    const {
      nodeEnv = this.options.nodeEnv,
      logger = this.options.logger,
      config = {},
    } = options;

    const env = (process.env[nodeEnv] || this.options.defaultEnv).toLowerCase();
    const usePath = this.determine.configFilePath(env, path || config.path);
    const envResult = dotenv.config({ ...config, path: usePath });

    if (envResult.error) {
      this.exit(
        chalk.red(
          `[ENV ${Level.Error}] failed to load '${usePath}': ${envResult.error}`
        ),
        logger
      );
    }
  }

  /**
   * Retrieve an environment variable
   *
   *
   * @template T
   * @param {string} key
   * @param {EnvOptions} [{
   *       mutators,
   *       defaultValue,
   *       defaultFor = {},
   *       logger = this.options.logger,
   *       warnOnly = this.options.warnOnly,
   *       productionDefaults = this.options.productionDefaults,
   *     }={}]
   * @returns {T}
   * @memberof Envirator
   */
  provide<T = string>(
    key: string,
    {
      mutators,
      set = this.options.set,
      logger = this.options.logger,
      warnOnly = this.options.warnOnly,
      suppressWarnings = this.options.suppressWarnings,
      ...options
    }: EnvOptions = {}
  ): T {
    const value = this.determine.environmentValue(key, options);

    this.exitOrWarn(key, value, warnOnly, logger, suppressWarnings);

    const mutatedValue = asArray(mutators!).reduce(
      (memo: any, func) => func.call(null, memo),
      value
    ) as T;

    const determinedValue = this.determine.environmentOverride(
      mutatedValue,
      options
    );

    return this.setIfNeeded(key, determinedValue, set);
  }

  private setIfNeeded<T>(key: string, value: T, shouldSet: boolean): T {
    if (shouldSet && !isUndefined(value)) {
      this.setEnv(key, value);
    }

    return value;
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
          keyTo = defaultMutator,
          camelcase = this.options.camelcase,
        } = envar as EnvManyOptions;
        const opts: EnvOptions = isString(envar) ? {} : envar;
        const useKey = this.determine.environmentKey(key, camelcase, keyTo);

        return {
          ...memo,
          [useKey]: this.provide(key, opts),
        };
      }, {} as T)
    );
  }

  setEnv(key: string, value: any): void;
  setEnv(enVars: EnvManyResult): void;
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
    return this.currentEnv === this.options.environments.production;
  }

  /**
   * Property that indicates if the current environment is development
   *
   * @readonly
   * @type {boolean}
   * @memberof Envirator
   */
  get isDevelopment(): boolean {
    return this.currentEnv === this.options.environments.development;
  }

  /**
   * Property that indicates if the current environment is test
   *
   * @readonly
   * @type {boolean}
   * @memberof Envirator
   */
  get isTest(): boolean {
    return this.currentEnv === this.options.environments.test;
  }

  /**
   * Property that indicates if the current environment is staging
   *
   * @readonly
   * @type {boolean}
   * @memberof Envirator
   */
  get isStaging(): boolean {
    return this.currentEnv === this.options.environments.staging;
  }

  /**
   * Retrieve the current environment
   *
   * @type {string}
   * @memberof Envirator
   */
  get currentEnv(): string {
    const { defaultEnv, nodeEnv, logger } = this.options;
    const env = process.env[nodeEnv];

    return this.doesNotHaveNodeEnv(env)
      ? (this.exitOrWarn(nodeEnv, undefined, false, logger) as any)
      : toLowerCase(env || defaultEnv);
  }

  private doesNotHaveNodeEnv(env: string | undefined): boolean {
    return (
      this.options.noDefaultEnv && (isUndefined(env) || isEmptyString(env))
    );
  }

  set currentEnv(env: string) {
    this.setEnv(this.options.nodeEnv, env);
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
  protected exitOrWarn(
    key: string,
    value: string | undefined,
    warnOnly: boolean,
    logger: EnvLogger,
    suppressWarnings = this.options.suppressWarnings
  ): void | never {
    if (isUndefined(value)) {
      const level = '%level%';
      const message = `[ENV ${level}]: Missing environment variable '${key}'`;

      if (this.determine.shouldExit(warnOnly)) {
        return this.exit(
          chalk.red(message.replace(level, Level.Error)),
          logger
        );
      }

      if (this.determine.shouldWarn(key, suppressWarnings)) {
        logger.warn(chalk.yellow(message.replace(level, Level.Warn)));
      }
    }
  }
}
