import { Envirator, EnvInitOptions } from '../src';
import { expect } from 'chai';

class CustomEnv extends Envirator {
  constructor({ envs = {}, ...options }: EnvInitOptions = {}) {
    super({
      ...options,
      defaultEnv: 'custom',
      envs: { custom: 'my_custom_env', ...envs },
    });
  }

  get isCustom() {
    return this.currentEnv === this.opts.envs.custom;
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
});
