import { EnvOptions } from './env-options.interface';
import { EnvManyResult } from './env-many-result.interface';

export interface EnvManyOptions extends EnvOptions {
  key: string;
  keyToJsProp?: boolean;
  keyTo?: string | KeyTo | KeyTo[];
}

export type ResultTo<T = EnvManyResult> = (value: any) => T;
export type KeyTo = (value: string) => string;
