export interface EnvMutator<T = any, R = any> {
  (value: T): R;
}
