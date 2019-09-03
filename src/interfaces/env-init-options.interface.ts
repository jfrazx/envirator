import { EnvStartOptions } from './env-start-options.interface';

export interface EnvInitOptions extends EnvStartOptions {
  nodeEnv?: string;
}
