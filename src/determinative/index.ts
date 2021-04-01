import { isUndefined, isString } from '../helpers';
import { EnvOptions, KeyTo } from '../interfaces';
import { EnvOptionsContainer } from '../options';
import { asArray } from '@jfrazx/asarray';
import { Envirator } from '../env';
import camelcase from 'camelcase';

export class Determinative {
  constructor(
    private readonly env: Envirator,
    private readonly options: EnvOptionsContainer
  ) {}

  environmentOverride<T = string>(
    value: T,
    {
      defaultValue,
      envOverride = [],
      defaultsFor = {},
      productionDefaults = this.options.productionDefaults,
    }: EnvOptions
  ): T {
    const useDefault = defaultsFor[this.env.currentEnv] ?? defaultValue;
    const shouldOverride = asArray(envOverride).some((override) =>
      override.call(null, value, useDefault)
    );

    return this.shouldOverride(shouldOverride, productionDefaults, useDefault)
      ? useDefault
      : value;
  }

  private shouldOverride(
    shouldOverride: boolean,
    provideDefaults: boolean,
    defaultValue: any
  ): boolean {
    return (
      shouldOverride &&
      this.canProvideDefaults(provideDefaults) &&
      !isUndefined(defaultValue)
    );
  }

  private canProvideDefaults(provideDefaults: boolean) {
    return !this.shouldNotProvideDefaults(provideDefaults);
  }

  environmentValue(
    key: string,
    {
      defaultValue,
      defaultsFor = {},
      allowEmptyString = this.options.allowEmptyString,
      productionDefaults = this.options.productionDefaults,
    }: EnvOptions
  ) {
    const useDefault = defaultsFor[this.env.currentEnv] ?? defaultValue;
    const value = this.accessEnvironmentVariable(key, allowEmptyString);

    return !isUndefined(value) ||
      this.shouldNotProvideDefaults(productionDefaults)
      ? value
      : useDefault;
  }

  private shouldNotProvideDefaults(provideDefaults: boolean): boolean {
    return !provideDefaults && this.env.isProduction;
  }

  private accessEnvironmentVariable(
    key: string,
    allowEmptyString: boolean
  ): any {
    const value = process.env[key];

    return !allowEmptyString && value?.trim().length === 0 ? void 0 : value;
  }

  environmentKey(
    key: string,
    toJsProp: boolean,
    keyTo: string | KeyTo | KeyTo[]
  ): string {
    const use = isString(keyTo) ? [() => keyTo] : asArray(keyTo);

    return this.mutateProperty(key, toJsProp ? [camelcase, ...use] : use);
  }

  private mutateProperty(key: string, mutators: KeyTo[]): string {
    return mutators.reduce((k, mutator) => mutator(k), key);
  }

  configFilePath(env: string, path: string | undefined): string {
    return isUndefined(path) ? `.env${env ? '.' : env}${env}` : path;
  }
}
