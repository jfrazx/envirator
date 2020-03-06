import { EnvLogger } from './env-logger.interface';

export interface EnvConfigOptions {
  noDefaultEnv?: boolean;
  logger?: EnvLogger;
  nodeEnv?: string;
}
