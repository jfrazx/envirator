export interface EnvMutator<T = any> {
  (value: any): T;
}
