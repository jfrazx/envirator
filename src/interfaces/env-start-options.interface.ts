import { EnvLogger } from './env-logger.interface';

export interface EnvStartOptions {
  logger?: EnvLogger;
  warnOnly?: boolean;
  productionDefaults?: boolean;
}
