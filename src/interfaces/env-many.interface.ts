import { EnvOptions } from './env-options.interface';

export type EnvMany = (string | EnvManyOptions)[];

export interface EnvManyResult<T = any> {
  [key: string]: T;
}

/**
 * `onError` is omitted deliberately. provideMany collects every missing key and
 * raises a single aggregate error, so a per-entry failure policy could never be
 * honoured. Supply `onError` when constructing Envirator, or catch the error.
 */
export interface EnvManyOptions extends Omit<EnvOptions, 'onError'> {
  /**
   * @description An environment variable
   */
  key: string;

  /**
   * @description Will transform an environment variable name into a camelcased property
   * @default EnvInitOptions.camelcase - false
   */
  camelcase?: boolean;

  /**
   * @description A string, function or array of functions to transform an environment variable name into an object property
   */
  keyTo?: string | KeyTo | KeyTo[];
}

export type ResultTo<T = EnvManyResult> = (value: any) => T;
export type KeyTo = (value: string) => string;
