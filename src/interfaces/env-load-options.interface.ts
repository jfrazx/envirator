import { EnvConfigOptions } from './env-config-options.interface';
import { Environments } from './env-environments.interface';
import { DotenvConfigOptions } from 'dotenv';

export interface EnvLoadOptions extends EnvConfigOptions {
  path?: string;
  config?: DotenvConfigOptions;
  envLoader?: Environments;
}
