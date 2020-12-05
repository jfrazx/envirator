import { EnvConfigOptions } from './env-config-options.interface';
import { EnvStartOptions } from './env-start-options.interface';
import { Environments } from './env-environments.interface';

export interface EnvInitOptions extends EnvStartOptions, EnvConfigOptions {
  envs?: Environments;
  defaultEnv?: string;
  keyToJsProp?: boolean;
  doNotWarnIn?: string[];
}
