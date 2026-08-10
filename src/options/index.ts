import {
  EnvInitOptions,
  EnvErrorHandler,
  EnvLogger,
  Environments,
  WarningSuppressor,
} from '../interfaces';
import { Default, Environment } from '../enums';
import { toLowerCase } from '../helpers';

const defaultEnvs: Required<Environments> = {
  development: Environment.Development,
  production: Environment.Production,
  staging: Environment.Staging,
  test: Environment.Test,
};

const noop = () => {};

interface WorkingOptions extends Required<EnvInitOptions> {}

export class EnvOptionsContainer implements WorkingOptions {
  readonly environments!: Required<Environments>;
  readonly suppressWarnings: WarningSuppressor;
  readonly productionDefaults: boolean;
  readonly allowEmptyString: boolean;
  readonly doNotWarnIn: string[];
  readonly noDefaultEnv: boolean;
  readonly defaultEnv: string;
  readonly onError: EnvErrorHandler;
  readonly camelcase: boolean;
  readonly logger: EnvLogger;
  readonly warnOnly: boolean;
  readonly nodeEnv: string;

  constructor({
    productionDefaults = false,
    nodeEnv = Default.NodeEnv,
    suppressWarnings = false,
    allowEmptyString = true,
    noDefaultEnv = false,
    onError = noop,
    environments = {},
    logger = console,
    warnOnly = false,
    camelcase = false,
    doNotWarnIn,
    defaultEnv,
  }: EnvInitOptions = {}) {
    this.logger = logger;
    this.onError = onError;
    this.nodeEnv = nodeEnv;
    this.warnOnly = warnOnly;
    this.camelcase = camelcase;
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
      : (this.environments[defaultEnv as string]?.trim() ??
        this.environments.development);

    this.doNotWarnIn = doNotWarnIn?.map(toLowerCase) ?? [
      this.environments.production,
    ];
  }
}
