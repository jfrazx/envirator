import { EnvOptions } from './env-options.interface';

export type EnvMany = (string | EnvManyOptions)[];

export interface EnvManyResult<T = any> {
  [key: string]: T;
}

export interface EnvManyOptions extends EnvOptions {
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
   * @deprecated Use camelcase
   */
  keyToJsProp?: boolean;

  /**
   * @description A string, function or array of functions to transform an environment variable name into an object property
   */
  keyTo?: string | KeyTo | KeyTo[];
}

export type ResultTo<T = EnvManyResult> = (value: any) => T;
export type KeyTo = (value: string) => string;
