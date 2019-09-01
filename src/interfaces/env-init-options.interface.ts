import { EnvLogger } from './env-logger.interface';

export interface EnvInitOptions {
  logger?: EnvLogger;
  warnOnly?: boolean;
  productionDefaults?: boolean;
}
