import type { Environments } from './env-environments.interface';
import type { EnvConfigOptions } from './env-options.interface';
import type { DotenvConfigOptions } from 'dotenv';

export interface EnvLoadOptions extends EnvConfigOptions {
  /**
   * @description path to config file
   */
  path?: string;

  /**
   * @Config loading options for dotenv
   */
  config?: DotenvConfigOptions;

  /**
   * @todo Currently unused
   */
  envLoader?: Environments;
}
