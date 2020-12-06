import { EnvInitOptions, EnvLogger, Environments } from '../interfaces';
import { Default, Environment } from '../enums';
import { toLowerCase } from '../helpers';

const defaultEnvs: Required<Environments> = {
  development: Environment.Development,
  production: Environment.Production,
  staging: Environment.Staging,
  test: Environment.Test,
};

interface WorkingOptions
  extends Required<Omit<EnvInitOptions, 'envs' | 'keyToJsProp'>> {}

export class EnvOptionsContainer implements WorkingOptions {
  readonly environments!: Required<Environments>;
  readonly productionDefaults: boolean;
  readonly doNotWarnIn: string[];
  readonly noDefaultEnv: boolean;
  readonly defaultEnv: string;
  readonly camelcase: boolean;
  readonly logger: EnvLogger;
  readonly warnOnly: boolean;
  readonly nodeEnv: string;

  constructor({
    productionDefaults = false,
    nodeEnv = Default.NodeEnv,
    noDefaultEnv = false,
    environments = {},
    logger = console,
    warnOnly = false,
    keyToJsProp,
    doNotWarnIn,
    defaultEnv,
    camelcase,
    envs = {},
  }: EnvInitOptions = {}) {
    this.logger = logger;
    this.nodeEnv = nodeEnv;
    this.warnOnly = warnOnly;
    this.camelcase = camelcase ?? keyToJsProp ?? false;
    this.noDefaultEnv = noDefaultEnv;
    this.productionDefaults = productionDefaults;
    this.environments = Object.entries({
      ...defaultEnvs,
      ...envs,
      ...environments,
    }).reduce(
      (memo, [key, value]) => ({
        ...memo,
        [key]: toLowerCase(value),
      }),
      {}
    ) as Required<Environments>;

    this.defaultEnv = this.noDefaultEnv
      ? ''
      : this.environments[defaultEnv as string]?.trim() ??
        this.environments.development;

    this.doNotWarnIn = doNotWarnIn?.map(toLowerCase) ?? [
      this.environments.production,
    ];
  }
}
