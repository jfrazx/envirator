import { DotenvConfigOptions } from 'dotenv';

import { EnvConfigOptions } from './env-config-options.interface';

export interface EnvLoadOptions extends EnvConfigOptions {
  config?: DotenvConfigOptions;
}
