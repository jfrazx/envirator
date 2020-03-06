import { EnvOptions } from './env-options.interface';

export interface EnvManyOptions extends EnvOptions {
  key: string;
  keyToJsProp?: boolean;
}
