import { EnvStartOptions } from './env-start-options.interface';
import { EnvMutator } from './env-mutator.interface';

export interface EnvOptions extends EnvStartOptions {
  defaultValue?: any;
  mutators?: EnvMutator | EnvMutator[];
}
