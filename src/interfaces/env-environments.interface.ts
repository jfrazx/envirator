interface Envs {
  test?: string;
  staging?: string;
  production?: string;
  development?: string;
}

interface EnvironmentIndex {
  [env: string]: string;
}

export type Environments = Envs & EnvironmentIndex;
