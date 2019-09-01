import { EnvInitOptions } from './env-init-options.interface';

export interface EnvOptions extends EnvInitOptions {
  defaultValue?: any;
  mutators?: Function | Function[];
}
