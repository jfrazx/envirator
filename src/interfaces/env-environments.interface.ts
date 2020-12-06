interface DefaultEnvironments {
  test?: string;
  staging?: string;
  production?: string;
  development?: string;
}

interface EnvironmentMap {
  [env: string]: string;
}

export type Environments = DefaultEnvironments & EnvironmentMap;
