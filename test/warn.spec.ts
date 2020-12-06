import { Env, Environment } from '../src';
import * as sinon from 'sinon';
import { expect } from 'chai';
import chalk from 'chalk';
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
      chalk.yellow(`[ENV WARN]: Missing environment variable 'I_DONT_EXIST'`)
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

    const undef = env.provide('I_DONT_EXIST');

    expect(undef).to.be.undefined;

    sinon.assert.calledOnce(logger.error as any);
    sinon.assert.calledWith(
      logger.error as any,
      chalk.red(`[ENV ERROR]: Missing environment variable 'I_DONT_EXIST'`)
    );
    sinon.assert.called(process.exit as any);
    sinon.assert.calledWith(process.exit as any, 1);
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
      chalk.yellow(`[ENV WARN]: Missing environment variable 'I_DONT_EXIST'`)
    );
    sinon.assert.notCalled(process.exit as any);
  });

  it('should not warn in production', () => {
    const env = new Env({
      warnOnly: true,
      logger,
    });

    env.currentEnv = Environment.Production;

    const undef = env.provide('I_DONT_EXIST');

    expect(undef).to.be.undefined;

    sinon.assert.calledOnce(logger.error as any);
    sinon.assert.calledWith(
      logger.error as any,
      chalk.red(`[ENV ERROR]: Missing environment variable 'I_DONT_EXIST'`)
    );
    sinon.assert.called(process.exit as any);
    sinon.assert.calledWith(process.exit as any, 1);
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
      chalk.yellow(`[ENV WARN]: Missing environment variable 'I_DONT_EXIST'`)
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

    const undef = env.provide('I_DONT_EXIST');

    expect(undef).to.be.undefined;

    sinon.assert.calledOnce(logger.error as any);
    sinon.assert.calledWith(
      logger.error as any,
      chalk.red(`[ENV ERROR]: Missing environment variable 'I_DONT_EXIST'`)
    );
    sinon.assert.called(process.exit as any);
    sinon.assert.calledWith(process.exit as any, 1);
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
      chalk.yellow(`[ENV WARN]: Missing environment variable 'I_DONT_EXIST'`)
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

    const undef = env.provide('I_DONT_EXIST');

    expect(undef).to.be.undefined;

    sinon.assert.calledOnce(logger.error as any);
    sinon.assert.calledWith(
      logger.error as any,
      chalk.red(`[ENV ERROR]: Missing environment variable 'I_DONT_EXIST'`)
    );
    sinon.assert.called(process.exit as any);
    sinon.assert.calledWith(process.exit as any, 1);
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
      const errorMessage = `[ENV ERROR]: Missing environment variable '${envVar}'`;
      const provided = env.provide(envVar);

      expect(provided).to.be.undefined;
      sinon.assert.calledWith(logger.error as any, chalk.red(errorMessage));

      sinon.assert.called(process.exit as any);
      sinon.assert.calledWith(process.exit as any, 1);
    });
  });

  it('should warn in custom environments', () => {
    const env = new Env({
      warnOnly: true,
      logger,
      envs: {
        custom: 'custom',
      },
    });

    env.currentEnv = 'custom';

    const undef = env.provide('I_DONT_EXIST_CUSTOM');

    expect(undef).to.be.undefined;

    sinon.assert.calledOnce(logger.warn as any);
    sinon.assert.calledWith(
      logger.warn as any,
      chalk.yellow(
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

    const undef = env.provide('I_DONT_EXIST_CUSTOM_FAIL');

    expect(undef).to.be.undefined;

    sinon.assert.calledOnce(logger.error as any);
    sinon.assert.calledWith(
      logger.error as any,
      chalk.red(
        `[ENV ERROR]: Missing environment variable 'I_DONT_EXIST_CUSTOM_FAIL'`
      )
    );
    sinon.assert.called(process.exit as any);
    sinon.assert.calledWith(process.exit as any, 1);
  });

  it('should not warn in modified built-in environments', () => {
    const development = 'develop';
    const production = 'prod';
    const staging = 'staged';
    const test = 'testing';

    const doNotWarnIn = [test, staging, development, production];

    const env = new Env({
      doNotWarnIn,
      envs: {
        test,
        staging,
        production,
        development,
      },
      logger,
    });

    doNotWarnIn.forEach((environment) => {
      const envVar = `DOES_NOT_EXIST_${environment.toUpperCase()}`;
      const errorMessage = `[ENV ERROR]: Missing environment variable '${envVar}'`;

      env.currentEnv = environment;

      const provided = env.provide(envVar);

      expect(provided).to.be.undefined;

      sinon.assert.called(logger.error as any);
      sinon.assert.calledWith(logger.error as any, chalk.red(errorMessage));

      sinon.assert.called(process.exit as any);
      sinon.assert.calledWith(process.exit as any, 1);
    });
  });
});
