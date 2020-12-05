import { EnvInitOptions, EnvLogger, Environments } from '../interfaces';
import { Default, Environment } from '../enums';
import { toLowerCase } from '../helpers';

const defaultEnvs: Required<Environments> = {
  development: Environment.Development,
  production: Environment.Production,
  staging: Environment.Staging,
  test: Environment.Test,
};

export class EnvOptionsContainer implements Required<EnvInitOptions> {
  readonly envs: Required<Environments>;
  readonly productionDefaults: boolean;
  readonly doNotWarnIn: string[];
  readonly noDefaultEnv: boolean;
  readonly keyToJsProp: boolean;
  readonly defaultEnv: string;
  readonly logger: EnvLogger;
  readonly warnOnly: boolean;
  readonly nodeEnv: string;

  constructor({
    productionDefaults = false,
    nodeEnv = Default.NodeEnv,
    noDefaultEnv = false,
    keyToJsProp = false,
    logger = console,
    warnOnly = false,
    doNotWarnIn,
    defaultEnv,
    envs = {},
  }: EnvInitOptions = {}) {
    this.logger = logger;
    this.nodeEnv = nodeEnv;
    this.warnOnly = warnOnly;
    this.keyToJsProp = keyToJsProp;
    this.noDefaultEnv = noDefaultEnv;
    this.productionDefaults = productionDefaults;
    this.envs = Object.entries({
      ...defaultEnvs,
      ...envs,
    }).reduce(
      (memo, [key, value]) => ({
        ...memo,
        [key]: toLowerCase(value),
      }),
      {}
    ) as Required<Environments>;

    this.defaultEnv = this.noDefaultEnv
      ? ''
      : this.envs[defaultEnv as string]?.trim() ?? this.envs.development;
    this.doNotWarnIn = doNotWarnIn?.map(toLowerCase) ?? [this.envs.production];
  }
}
