import { Env, Environment, MissingEnvironmentError } from '../src';
import * as sinon from 'sinon';
import { expect } from 'chai';
import pc from 'picocolors';
import pino from 'pino';

const logger = pino();

describe('DoNotWarn', () => {
  let originalEnv: any;

  before(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    sinon.restore();
    process.env = { ...originalEnv };
  });

  beforeEach(() => {
    sinon.stub(logger, 'error');
    sinon.stub(logger, 'warn');
    sinon.stub(process, 'exit');
  });

  it('should warn in development', () => {
    const env = new Env({
      warnOnly: true,
      logger,
    });

    env.currentEnv = Environment.Development;

    const undef = env.provide('I_DONT_EXIST');

    expect(undef).to.be.undefined;

    sinon.assert.calledOnce(logger.warn as any);
    sinon.assert.calledWith(
      logger.warn as any,
      pc.yellow(`[ENV WARN]: Missing environment variable 'I_DONT_EXIST'`)
    );
    sinon.assert.notCalled(process.exit as any);
  });

  it('should not warn in development', () => {
    const env = new Env({
      doNotWarnIn: [Environment.Development],
      warnOnly: true,
      logger,
    });

    env.currentEnv = Environment.Development;

    expect(() => env.provide('I_DONT_EXIST')).to.throw(
      MissingEnvironmentError,
      `Missing environment variable: 'I_DONT_EXIST'`
    );

    sinon.assert.notCalled(logger.error as any);
    sinon.assert.notCalled(logger.warn as any);
    sinon.assert.notCalled(process.exit as any);
  });

  it('should warn in production', () => {
    const env = new Env({
      doNotWarnIn: [],
      warnOnly: true,
      logger,
    });

    env.currentEnv = Environment.Production;

    const undef = env.provide('I_DONT_EXIST');

    expect(undef).to.be.undefined;

    sinon.assert.calledOnce(logger.warn as any);
    sinon.assert.calledWith(
      logger.warn as any,
      pc.yellow(`[ENV WARN]: Missing environment variable 'I_DONT_EXIST'`)
    );
    sinon.assert.notCalled(process.exit as any);
  });

  it('should not warn in production', () => {
    const env = new Env({
      warnOnly: true,
      logger,
    });

    env.currentEnv = Environment.Production;

    expect(() => env.provide('I_DONT_EXIST')).to.throw(
      MissingEnvironmentError,
      `Missing environment variable: 'I_DONT_EXIST'`
    );

    sinon.assert.notCalled(logger.error as any);
    sinon.assert.notCalled(logger.warn as any);
    sinon.assert.notCalled(process.exit as any);
  });

  it('should warn in test', () => {
    const env = new Env({
      warnOnly: true,
      logger,
    });

    env.currentEnv = Environment.Test;

    const undef = env.provide('I_DONT_EXIST');

    expect(undef).to.be.undefined;

    sinon.assert.calledOnce(logger.warn as any);
    sinon.assert.calledWith(
      logger.warn as any,
      pc.yellow(`[ENV WARN]: Missing environment variable 'I_DONT_EXIST'`)
    );
    sinon.assert.notCalled(process.exit as any);
  });

  it('should not warn in test', () => {
    const env = new Env({
      doNotWarnIn: [Environment.Test],
      warnOnly: true,
      logger,
    });

    env.currentEnv = Environment.Test;

    expect(() => env.provide('I_DONT_EXIST')).to.throw(
      MissingEnvironmentError,
      `Missing environment variable: 'I_DONT_EXIST'`
    );

    sinon.assert.notCalled(logger.error as any);
    sinon.assert.notCalled(logger.warn as any);
    sinon.assert.notCalled(process.exit as any);
  });

  it('should warn in staging', () => {
    const env = new Env({
      warnOnly: true,
      logger,
    });

    env.currentEnv = Environment.Staging;

    const undef = env.provide('I_DONT_EXIST');

    expect(undef).to.be.undefined;

    sinon.assert.calledOnce(logger.warn as any);
    sinon.assert.calledWith(
      logger.warn as any,
      pc.yellow(`[ENV WARN]: Missing environment variable 'I_DONT_EXIST'`)
    );
    sinon.assert.notCalled(process.exit as any);
  });

  it('should not warn in staging', () => {
    const env = new Env({
      doNotWarnIn: [Environment.Staging],
      warnOnly: true,
      logger,
    });

    env.currentEnv = Environment.Staging;

    expect(() => env.provide('I_DONT_EXIST')).to.throw(
      MissingEnvironmentError,
      `Missing environment variable: 'I_DONT_EXIST'`
    );

    sinon.assert.notCalled(logger.error as any);
    sinon.assert.notCalled(logger.warn as any);
    sinon.assert.notCalled(process.exit as any);
  });

  it('should not warn in any default environment', () => {
    const envs = [
      Environment.Test,
      Environment.Staging,
      Environment.Production,
      Environment.Development,
    ];

    const env = new Env({
      doNotWarnIn: envs,
      warnOnly: true,
      logger,
    });

    envs.forEach((environment) => {
      env.currentEnv = environment;
      const envVar = `I_DONT_EXIST_${environment.toUpperCase()}`;

      expect(() => env.provide(envVar)).to.throw(
        MissingEnvironmentError,
        `Missing environment variable: '${envVar}'`
      );
    });

    sinon.assert.notCalled(logger.error as any);
    sinon.assert.notCalled(logger.warn as any);
    sinon.assert.notCalled(process.exit as any);
  });

  it('should warn in custom environments', () => {
    const env = new Env({
      warnOnly: true,
      logger,
      environments: {
        custom: 'custom',
      },
    });

    env.currentEnv = 'custom';

    const undef = env.provide('I_DONT_EXIST_CUSTOM');

    expect(undef).to.be.undefined;

    sinon.assert.calledOnce(logger.warn as any);
    sinon.assert.calledWith(
      logger.warn as any,
      pc.yellow(
        `[ENV WARN]: Missing environment variable 'I_DONT_EXIST_CUSTOM'`
      )
    );
    sinon.assert.notCalled(process.exit as any);
  });

  it('should not warn in custom environments', () => {
    const env = new Env({
      doNotWarnIn: ['custom'],
      warnOnly: true,
      logger,
    });

    env.currentEnv = 'custom';

    expect(() => env.provide('I_DONT_EXIST_CUSTOM_FAIL')).to.throw(
      MissingEnvironmentError,
      `Missing environment variable: 'I_DONT_EXIST_CUSTOM_FAIL'`
    );

    sinon.assert.notCalled(logger.error as any);
    sinon.assert.notCalled(logger.warn as any);
    sinon.assert.notCalled(process.exit as any);
  });

  it('should not warn in modified built-in environments', () => {
    const development = 'develop';
    const production = 'prod';
    const staging = 'staged';
    const test = 'testing';

    const doNotWarnIn = [test, staging, development, production];

    const env = new Env({
      doNotWarnIn,
      environments: {
        test,
        staging,
        production,
        development,
      },
      logger,
    });

    doNotWarnIn.forEach((environment) => {
      const envVar = `DOES_NOT_EXIST_${environment.toUpperCase()}`;

      env.currentEnv = environment;

      expect(() => env.provide(envVar)).to.throw(
        MissingEnvironmentError,
        `Missing environment variable: '${envVar}'`
      );
    });

    sinon.assert.notCalled(logger.error as any);
    sinon.assert.notCalled(logger.warn as any);
    sinon.assert.notCalled(process.exit as any);
  });
});
