import { Envirator, EnvInitOptions } from '../src';
import { expect } from 'chai';

class CustomEnv extends Envirator {
  constructor({ environments = {}, ...options }: EnvInitOptions = {}) {
    super({
      ...options,
      defaultEnv: 'custom',
      // @ts-ignore
      environments: { custom: 'my_custom_env', ...environments },
    });
  }

  get isCustom() {
    return this.currentEnv === this.options.environments.custom;
  }
}

describe('Extend', () => {
  let originalEnv: any;

  before(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should extend Envirator', () => {
    const env = new CustomEnv();

    expect(env).to.be.instanceOf(CustomEnv);
    expect(env).to.be.instanceOf(Envirator);
  });

  it('should have a default environment of custom', () => {
    const env = new CustomEnv();

    expect(env.currentEnv).to.equal('my_custom_env');
  });

  it('should return true when retrieving isCustom', () => {
    const env = new CustomEnv();

    expect(env.isCustom).to.be.true;
  });

  it('should return false for all other env helpers', () => {
    const env = new CustomEnv();

    expect(env.isDevelopment).to.be.false;
    expect(env.isProduction).to.be.false;
    expect(env.isStaging).to.be.false;
    expect(env.isTest).to.be.false;
  });
});
