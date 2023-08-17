import { Default, Environment } from '../enums';
import { toLowerCase } from '../helpers';
import type {
  EnvLogger,
  Environments,
  EnvInitOptions,
  WarningSuppressor,
} from '../interfaces';

const defaultEnvs: Required<Environments> = {
  development: Environment.Development,
  production: Environment.Production,
  staging: Environment.Staging,
  test: Environment.Test,
};

type DeprecatedOptions = 'envs' | 'keyToJsProp';

interface WorkingOptions
  extends Required<Omit<EnvInitOptions, DeprecatedOptions>> {}

export class EnvOptionsContainer implements WorkingOptions {
  readonly environments!: Required<Environments>;
  readonly suppressWarnings: WarningSuppressor;
  readonly productionDefaults: boolean;
  readonly allowEmptyString: boolean;
  readonly doNotWarnIn: string[];
  readonly noDefaultEnv: boolean;
  readonly defaultEnv: string;
  readonly camelcase: boolean;
  readonly logger: EnvLogger;
  readonly warnOnly: boolean;
  readonly nodeEnv: string;
  readonly set: boolean;

  constructor({
    productionDefaults = false,
    nodeEnv = Default.NodeEnv,
    suppressWarnings = false,
    allowEmptyString = true,
    noDefaultEnv = false,
    environments = {},
    logger = console,
    warnOnly = false,
    doNotWarnIn,
    set = false,
    defaultEnv,
    camelcase,
  }: EnvInitOptions = {}) {
    this.set = set;
    this.logger = logger;
    this.nodeEnv = nodeEnv;
    this.warnOnly = warnOnly;
    this.camelcase = camelcase ?? false;
    this.noDefaultEnv = noDefaultEnv;
    this.allowEmptyString = allowEmptyString;
    this.productionDefaults = productionDefaults;
    this.suppressWarnings = Array.isArray(suppressWarnings)
      ? suppressWarnings.map((e) => e.toLowerCase())
      : suppressWarnings;
    this.environments = Object.entries({
      ...defaultEnvs,
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
