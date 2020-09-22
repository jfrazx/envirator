import { EnvStartOptions } from './env-start-options.interface';
import { EnvMutator } from './env-mutator.interface';

export interface EnvOptions extends EnvStartOptions {
  defaultValue?: any;
  defaultsFor?: DefaultsFor;
  mutators?: EnvMutator | EnvMutator[];
}

export type DefaultsFor = {
  test?: any;
  staging?: any;
  production?: any;
  development?: any;
} & { [env: string]: any };
