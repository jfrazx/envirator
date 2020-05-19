interface Envs {
  production?: string;
  development?: string;
  test?: string;
  staging?: string;
}

interface EnvironmentIndex {
  [env: string]: string;
}

export type Environments = Envs & EnvironmentIndex;
