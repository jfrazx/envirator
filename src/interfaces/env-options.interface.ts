import { Environments } from './env-environments.interface';
import { EnvLogger } from './env-logger.interface';
import { EnviratorError } from '../errors';
import { Envirator } from '../env/index';

export type EnvMutator<T = any, R = any> = (value: T) => R;
export type EnvWarningSuppression = (key: string, env: Envirator) => boolean;
export type EnvErrorHandler = (error: EnviratorError) => void;

interface EnvSharedOptions {
  /**
   * @description Prints warning messages to the terminal. Failures are thrown, not logged.
   * @default console
   */
  logger?: EnvLogger;

  /**
   * @description Warn of missing environment variables rather than exit. Does nothing in environments designated in `doNotWarnIn`
   * @default false
   */
  warnOnly?: boolean;

  /**
   * @description Specifies if supplied default values should be allowed in a production environment
   * @default false
   */
  productionDefaults?: boolean;

  /**
   * @description Set if empty string is an acceptable environment variable value
   * @default true
   */
  allowEmptyString?: boolean;

  /**
   * @description Suppress warning output. Acceptable values are boolean, a function that will receive the current key and envirator instance or an array of environments in which to suppress warnings
   *
   *  @default false
   */
  suppressWarnings?: WarningSuppressor;

  /**
   * @description Supplies the failure policy. Receives the error before it is thrown, which
   *    allows an application to log, aggregate or terminate as it sees fit. If the handler
   *    returns, the error is thrown.
   * @default undefined
   * @example
   *    createEnv({
   *      onError: (error) => {
   *        console.error(error.message);
   *        process.exit(1);
   *      },
   *    });
   */
  onError?: EnvErrorHandler;
}

export interface EnvOptions extends EnvSharedOptions {
  /**
   * @description A default value to provide for missing environment variables
   */
  defaultValue?: any;

  /**
   * @description A mapping of default values per environment
   */
  defaultsFor?: DefaultsFor;

  /**
   * @description A function or array of functions that will transform an environment variable
   */
  mutators?: EnvMutator | EnvMutator[];

  /**
   * @description A function or array of functions that receive the current environment variable value
   *    and determines if the defaultValue should be used instead.
   */
  envOverride?: EnvOverride | EnvOverride[];
}

export type EnvOverride = (value: any, defaultValue: any) => boolean;

export type DefaultsFor = {
  test?: any;
  staging?: any;
  production?: any;
  development?: any;
} & { [env: string]: any };

export interface EnvConfigOptions {
  /**
   * @description Boolean to determine if a default environment should not be provided
   * @default false
   */
  noDefaultEnv?: boolean;

  /**
   * @description Prints warning messages to the terminal. Failures are thrown, not logged.
   * @default console
   */
  logger?: EnvLogger;

  /**
   * @description Change where to locate the Node environment.
   * @default NODE_ENV
   */
  nodeEnv?: string;

  /**
   * @description Supplies the failure policy. Receives the error before it is thrown.
   * @default undefined
   */
  onError?: EnvErrorHandler;
}

export interface EnvInitOptions extends EnvSharedOptions, EnvConfigOptions {
  /**
   * @description Overrides the default environment
   * @default development
   */
  defaultEnv?: string;

  /**
   * @description Will transform an environment variable name into a camelcased property
   * @default false
   */
  camelcase?: boolean;

  /**
   * @description An array of environment strings that disallow warning of missing environment variables
   * @default [production]
   */
  doNotWarnIn?: string[];
  /**
   * @description A map of default environment overrides and custom defined environments
   * @default
   *    {
   *      test: 'test',
   *      staging: 'staging',
   *      production: 'production',
   *      development: 'development',
   *    }
   *
   */
  environments?: Environments;
}

export type WarningSuppressor = boolean | EnvWarningSuppression | string[];
