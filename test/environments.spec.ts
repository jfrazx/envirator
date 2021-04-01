import { Envirator, Environment, createEnv } from '../src';
import { expect } from 'chai';

describe('Environments', () => {
  let originalEnv: any;

  before(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should provide a boolean based on if production environment', () => {
    const env = createEnv();

    env.setEnv('NODE_ENV', Environment.Test);
    expect(env.isProduction).to.be.false;

    env.setEnv('NODE_ENV', Environment.Production);
    expect(env.isProduction).to.be.true;

    env.setEnv('NODE_ENV', Environment.Development);
    expect(env.isProduction).to.be.false;

    env.setEnv('NODE_ENV', Environment.Staging);
    expect(env.isProduction).to.be.false;
  });

  it('should provide a boolean based on if staging environment', () => {
    const env = new Envirator();

    env.setEnv('NODE_ENV', Environment.Test);
    expect(env.isStaging).to.be.false;

    env.setEnv('NODE_ENV', Environment.Production);
    expect(env.isStaging).to.be.false;

    env.setEnv('NODE_ENV', Environment.Development);
    expect(env.isStaging).to.be.false;

    env.setEnv('NODE_ENV', Environment.Staging);
    expect(env.isStaging).to.be.true;
  });

  it('should provide a boolean based on if development environment', () => {
    const env = new Envirator();

    env.setEnv('NODE_ENV', Environment.Test);
    expect(env.isDevelopment).to.be.false;

    env.setEnv('NODE_ENV', Environment.Production);
    expect(env.isDevelopment).to.be.false;

    env.setEnv('NODE_ENV', Environment.Development);
    expect(env.isDevelopment).to.be.true;

    env.setEnv('NODE_ENV', Environment.Staging);
    expect(env.isDevelopment).to.be.false;
  });

  it('should provide a boolean based on if test environment', () => {
    const env = new Envirator();

    env.setEnv('NODE_ENV', Environment.Test);
    expect(env.isTest).to.be.true;

    env.setEnv('NODE_ENV', Environment.Production);
    expect(env.isTest).to.be.false;

    env.setEnv('NODE_ENV', Environment.Development);
    expect(env.isTest).to.be.false;

    env.setEnv('NODE_ENV', Environment.Staging);
    expect(env.isTest).to.be.false;
  });

  it('should allow environment name overrides', () => {
    const nodeEnv = 'NODE_ENV';
    const test = 'TESTs';
    const production = 'Prod';
    const staging = 'Stagings';
    const development = 'DevelopMents';

    const env = createEnv({
      environments: {
        test,
        staging,
        production,
        development,
      },
    });

    env.setEnv(nodeEnv, Environment.Test);
    expect(env.isTest).to.be.false;

    env.setEnv(nodeEnv, Environment.Production);
    expect(env.isProduction).to.be.false;

    env.setEnv(nodeEnv, Environment.Development);
    expect(env.isDevelopment).to.be.false;

    env.setEnv(nodeEnv, Environment.Staging);
    expect(env.isStaging).to.be.false;

    env.setEnv(nodeEnv, staging);
    expect(env.isStaging).to.be.true;

    env.setEnv(nodeEnv, development);
    expect(env.isDevelopment).to.be.true;

    env.setEnv(nodeEnv, test);
    expect(env.isTest).to.be.true;

    env.setEnv(nodeEnv, production);
    expect(env.isProduction).to.be.true;
  });
});
