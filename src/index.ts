import type { EnvInitOptions } from './interfaces';
import { Envirator } from './env';

export { Environment } from './enums';
export * from './interfaces';
export * from './env';

export const Env = Envirator;

export const createEnv = (options: EnvInitOptions = {}) =>
  new Envirator(options);

export default createEnv;
