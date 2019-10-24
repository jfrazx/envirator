import { Envirator, EnvManyOptions } from '../src';
import { expect } from 'chai';
import { join } from 'path';
import chalk from 'chalk';

import * as winston from 'winston';
import * as sinon from 'sinon';

describe('Envirator', () => {
  afterEach(() => {
    sinon.restore();
  });

  beforeEach(() => {
    sinon.stub(winston, 'error');
    sinon.stub(winston, 'warn');
    sinon.stub(process, 'exit');
  });

  it('should create envirator', () => {
    const envirator = new Envirator();

    expect(envirator).to.not.be.undefined;
  });

  it('should supply default values', () => {
    const envirator = new Envirator();

    expect(envirator.productionDefaults).to.be.false;
    expect(envirator.warnOnly).to.be.false;
    expect(envirator.logger).to.equal(console);
    expect(envirator.nodeEnv).to.equal('NODE_ENV');
  });

  it('should allow defaults to be overriden', () => {
    const envirator = new Envirator({
      productionDefaults: true,
      warnOnly: true,
      logger: {
        warn: console.log,
        error: console.error,
      },
      nodeEnv: 'NODE_ENVIRONMENT',
    });

    expect(envirator.productionDefaults).to.be.true;
    expect(envirator.warnOnly).to.be.true;
    expect(envirator.logger).to.not.equal(console);
    expect(envirator.nodeEnv).to.equal('NODE_ENVIRONMENT');
  });

  it('should warn when an env var does not exist', () => {
    const envirator = new Envirator({ warnOnly: true });

    sinon.stub(console, 'warn');

    expect(envirator.provide('SOME_ENV_VAR')).to.be.undefined;
    sinon.assert.called(console.warn as any);
    sinon.assert.calledWith(
      console.warn as any,
      chalk.yellow(`[ENV WARN]: Missing environment variable 'SOME_ENV_VAR'`)
    );
  });

  it('should load a config based on the environment', () => {
    const envirator = new Envirator({
      warnOnly: true,
    });

    Envirator.load();

    expect(envirator.provide('PORTAL')).to.equal('5200');
    expect(envirator.provide('SESSIONAL')).to.equal('thisissession');
  });

  it('should load a config from a path', () => {
    const envirator = new Envirator({
      warnOnly: true,
      logger: {
        warn: () => {},
        error: console.error,
      },
    });

    const value = envirator.provide('PORTZ');
    const sess = envirator.provide('SESSIONZ');

    expect(value).to.be.undefined;
    expect(sess).to.be.undefined;

    envirator.load(join(__dirname, '.env.development'));

    const port = envirator.provide('PORTZ', { logger: winston });
    const session = envirator.provide('SESSIONZ');

    expect(port).to.not.be.undefined;
    expect(port).to.equal('5200');

    expect(session).to.not.be.undefined;
    expect(session).to.equal('thisissession');
  });

  it('should exit if config loading fails', () => {
    const error = sinon.stub(console, 'error');

    const envirator = new Envirator();

    envirator.load('config.fail');

    sinon.assert.called(error);
    sinon.assert.calledWith(
      error,
      chalk.red(
        `[ENV ERROR] failed to load 'config.fail': Error: ENOENT: no such file or directory, open 'config.fail'`
      )
    );
    sinon.assert.called(process.exit as any);
    sinon.assert.calledWith(process.exit as any, 1);
  });

  it('should accept a single mutator', () => {
    const envirator = new Envirator({ warnOnly: true });
    envirator.load(join(__dirname, '.env.development'));

    const port = envirator.provide('PORTZ', { mutators: parseInt });

    expect(port).to.be.a('number');
    expect(port).to.equal(5200);
  });

  it('should accept an array of mutators', () => {
    const envirator = new Envirator({ warnOnly: true });
    envirator.load(join(__dirname, '.env.development'));

    const port = envirator.provide<number>('PORTZ', {
      mutators: [parseInt, (value: number) => value + 500],
      productionDefaults: true,
    });
    expect(port).to.equal(5700);
  });

  it('should accept an alternate logger when instantiating', () => {
    const envirator = new Envirator({ logger: winston });

    expect(envirator.provide('NODE_ENVZ')).to.be.undefined;

    sinon.assert.called(process.exit as any);
    sinon.assert.called(winston.error as any);
    sinon.assert.calledWith(process.exit as any, 1);
    sinon.assert.calledWith(
      winston.error as any,
      chalk.red(`[ENV ERROR]: Missing environment variable 'NODE_ENVZ'`)
    );
  });

  it('should override instantiated values', () => {
    const envirator = new Envirator({ warnOnly: true, logger: winston });

    expect(envirator.provide('WAT')).to.be.undefined;

    sinon.assert.called(winston.warn as any);
    sinon.assert.calledWith(
      winston.warn as any,
      chalk.yellow(`[ENV WARN]: Missing environment variable 'WAT'`)
    );

    expect(envirator.provide('WAT', { warnOnly: false })).be.undefined;

    sinon.assert.called(winston.error as any);
    sinon.assert.calledWith(
      winston.error as any,
      chalk.red(`[ENV ERROR]: Missing environment variable 'WAT'`)
    );

    sinon.assert.called(process.exit as any);
    sinon.assert.calledWith(process.exit as any, 1);
  });

  it('should set environment variables', () => {
    const envirator = new Envirator({
      warnOnly: true,
      logger: {
        warn: () => {},
        error: console.error,
      },
    });

    expect(envirator.provide('NODE_ENVZ')).to.be.undefined;

    envirator.setEnv('NODE_ENVZ', 'production');

    const env = envirator.provide('NODE_ENVZ');

    expect(env).to.not.be.undefined;
    expect(env).to.equal('production');
  });

  it('should set an object of environment variables', () => {
    const envirator = new Envirator({
      warnOnly: true,
      logger: {
        warn: () => {},
        error: console.error,
      },
    });
    const enVars = {
      NODE_ENVS: 'production',
      PORTS: 8200,
      SESSIONS: 'session-stuff',
      SYMBLZZ: Symbol('something'),
    };

    Object.keys(enVars).forEach(key => {
      expect(envirator.provide(key)).to.be.undefined;
    });

    envirator.setEnv(enVars);

    Object.entries(enVars).forEach(([key, value]) => {
      expect(envirator.provide(key)).to.not.be.undefined;
      expect(envirator.provide(key)).to.equal(String(value));
    });
  });

  it('should provide a default value', () => {
    const envirator = new Envirator({
      warnOnly: true,
      logger: {
        warn: () => {},
        error: console.error,
      },
    });

    expect(envirator.provide('NOT_EXISTS')).to.be.undefined;
    expect(
      envirator.provide('NOT_EXISTS', { defaultValue: 'defaults' })
    ).to.equal('defaults');
  });

  it('should not provide defaults during production', () => {
    const envirator = new Envirator({
      warnOnly: true,
      logger: winston,
    });

    envirator.setEnv('NODE_ENV', 'production');

    expect(envirator.provide('SOME_VAR', { defaultValue: 'someValue' })).to.be
      .undefined;

    sinon.assert.called(winston.error as any);
    sinon.assert.called(process.exit as any);
    sinon.assert.calledWith(process.exit as any, 1);
  });

  it('should not warn in production', () => {
    const envirator = new Envirator({
      warnOnly: true,
      logger: winston,
    });

    envirator.setEnv('NODE_ENV', 'production');

    expect(envirator.provide('SOME_VAR')).to.be.undefined;

    sinon.assert.notCalled(winston.warn as any);
    sinon.assert.called(winston.error as any);
    sinon.assert.called(process.exit as any);
    sinon.assert.calledWith(process.exit as any, 1);
  });

  it('should allow production defaults when initialized', () => {
    const envirator = new Envirator({
      warnOnly: true,
      logger: winston,
      productionDefaults: true,
    });

    envirator.setEnv('NODE_ENV', 'production');

    expect(
      envirator.provide('SOME_VAR', { defaultValue: 'someValue' })
    ).to.equal('someValue');
  });

  it('should allow production defaults on request', () => {
    const envirator = new Envirator({
      warnOnly: true,
      logger: winston,
    });

    envirator.setEnv('NODE_ENV', 'production');

    expect(
      envirator.provide('SOME_VAR', {
        defaultValue: 'someValue',
      })
    ).to.be.undefined;

    expect(
      envirator.provide('SOME_VAR', {
        defaultValue: 'someValue',
        productionDefaults: true,
      })
    ).to.equal('someValue');
  });

  it('should provide many environment variables', () => {
    const env = new Envirator({
      warnOnly: true,
      logger: {
        warn: () => {},
        error: console.error,
      },
    });

    env.setEnv('NODE_ENV', 'development');
    const opt: EnvManyOptions = {
      key: 'NODE_ENV',
      defaultValue: 'development',
    };
    const options = [opt, 'SOME_VAR', { key: 'UNKNOWN' }];

    const envars = env.provideMany(options);

    expect(envars).to.be.an('object');
  });

  it('should provide a boolean based on if production environment', () => {
    const env = new Envirator();

    env.setEnv('NODE_ENV', 'test');

    expect(env.isProduction).to.be.false;

    env.setEnv('NODE_ENV', 'production');
    expect(env.isProduction).to.be.true;

    env.setEnv('NODE_ENV', 'development');
    expect(env.isProduction).to.be.false;
  });

  it('should supply the current environment', () => {
    const env = new Envirator();

    expect(env.currentEnv).to.equal('development');

    env.setEnv('NODE_ENV', 'production');
    expect(env.currentEnv).to.equal('production');

    env.currentEnv = 'test';
    expect(env.currentEnv).to.equal('test');
  });
});
