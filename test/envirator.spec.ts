import { Envirator, EnvManyOptions, Env, EnvManyResult } from '../src';
import { expect } from 'chai';
import { join } from 'path';
import chalk from 'chalk';

import * as winston from 'winston';
import * as sinon from 'sinon';

describe('Envirator', () => {
  let originalEnv: any;

  before(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    sinon.restore();
    process.env = { ...originalEnv };
  });

  beforeEach(() => {
    sinon.stub(winston, 'error');
    sinon.stub(winston, 'warn');
    sinon.stub(process, 'exit');
  });

  describe('General', () => {
    it('should create envirator', () => {
      const envirator = new Envirator();

      expect(envirator).to.not.be.undefined;
    });
  });

  describe('Behavior', () => {
    it('should warn when an env var does not exist', () => {
      const envirator = new Envirator({ warnOnly: true });

      const warn = sinon.stub(console, 'warn');

      expect(envirator.provide('SOME_ENV_VAR')).to.be.undefined;

      sinon.assert.called(warn);
      sinon.assert.calledWith(
        warn,
        chalk.yellow(`[ENV WARN]: Missing environment variable 'SOME_ENV_VAR'`)
      );
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

    it('should exit when noDefaultEnv is set to true', () => {
      const env = new Envirator({
        noDefaultEnv: true,
        warnOnly: true,
        logger: winston,
      });

      const currentEnv = env.currentEnv;

      expect(currentEnv).to.be.undefined;
      sinon.assert.called(winston.error as any);
      sinon.assert.calledWith(
        winston.error as any,
        chalk.red(`[ENV ERROR]: Missing environment variable 'NODE_ENV'`)
      );
      sinon.assert.called(process.exit as any);
      sinon.assert.calledWith(process.exit as any, 1);
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

  describe('Mutators', () => {
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
  });

  describe('SetEnvironment', () => {
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

      Object.keys(enVars).forEach((key) => {
        expect(envirator.provide(key)).to.be.undefined;
      });

      envirator.setEnv(enVars);

      Object.entries(enVars).forEach(([key, value]) => {
        expect(envirator.provide(key)).to.not.be.undefined;
        expect(envirator.provide(key)).to.equal(String(value));
      });
    });
  });

  describe('ProductionBehavior', () => {
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
  });

  describe('LoadConfig', () => {
    it('should load a config based on the environment', () => {
      const env = new Envirator({
        warnOnly: true,
      });

      env.load();

      expect(env.provide('PORTAL')).to.equal('5200');
      expect(env.provide('SESSIONAL')).to.equal('thisissession');
    });

    it('should load a config when passing an object', () => {
      const env = new Envirator({
        warnOnly: true,
      });

      env.load({
        logger: console,
        nodeEnv: 'development',
        config: {
          path: '.env.development',
        },
      });

      expect(env.provide('PORTAL')).to.equal('5200');
      expect(env.provide('SESSIONAL')).to.equal('thisissession');
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

      envirator.load('config.fail', {
        logger: console,
      });

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

    it('should exit when loading and noDefaultEnv is set', () => {
      const error = sinon.stub(console, 'error');
      const env = new Envirator({
        noDefaultEnv: true,
        logger: {
          warn: () => {},
          error,
        },
      });

      env.load();

      sinon.assert.called(error);
      sinon.assert.calledWith(
        error,
        chalk.red(
          `[ENV ERROR] failed to load '.env': Error: ENOENT: no such file or directory, open '.env'`
        )
      );
    });
  });

  describe('Provide', () => {
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
  });

  describe('ProvideMany', () => {
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
      expect(envars.NODE_ENV).to.exist;
      expect('SOME_VAR' in envars).to.be.true;
      expect('UNKNOWN' in envars).to.be.true;
    });

    it('should provide many environment variables with and without changing key', () => {
      const env = new Envirator({
        warnOnly: true,
        logger: {
          warn: () => {},
          error: console.error,
        },
        keyToJsProp: true,
      });

      env.setEnv('NODE_ENV', 'development');
      const opt: EnvManyOptions = {
        key: 'NODE_ENV',
        defaultValue: 'development',
        keyToJsProp: false,
      };
      const options = [
        opt,
        { key: 'SOME_VAR', defaultValue: 'some value' },
        { key: 'UNKNOWN-VAR', defaultValue: 'unknown' },
        { key: 'UNKNOWN-VAR_CHAR', defaultValue: 'meh' },
        { key: 'keyvar', defaultValue: 'content' },
        { key: 'keyCar', defaultValue: 'con-tent', keyToJsProp: false },
      ];

      const envars = env.provideMany(options);

      expect(envars.NODE_ENV).to.exist;
      expect(envars.someVar).to.exist;
      expect(envars.unknownVar).to.exist;
      expect(envars.unknownVarChar).to.exist;
      expect(envars.keyvar).to.exist;
      expect(envars.keyCar).to.exist;

      expect(envars.NODE_ENV).to.equal('development');
      expect(envars.someVar).to.equal('some value');
      expect(envars.unknownVar).to.equal('unknown');
      expect(envars.unknownVarChar).to.equal('meh');
      expect(envars.keyvar).to.equal('content');
      expect(envars.keyCar).to.equal('con-tent');
    });

    it('should provide many with key overrides', () => {
      const env = new Env({ keyToJsProp: true });

      const envars = env.provideMany([
        { key: 'TOKEN_SECKRET', keyTo: () => 'secret', defaultValue: 'token' },
        {
          key: 'REACT_APP_API_KEY',
          keyTo: () => 'apiKey',
          defaultValue: 'blahapi',
        },
        {
          key: 'SOME_ENV_VAR',
          keyTo: (value) => `${value}Key`,
          defaultValue: 'something',
        },
      ]);

      expect(envars.secret).to.exist;
      expect(envars.apiKey).to.exist;
      expect(envars.someEnvVarKey).to.exist;
      expect(envars.secret).to.equal('token');
      expect(envars.apiKey).to.equal('blahapi');
      expect(envars.someEnvVarKey).to.equal('something');
    });

    it('should provide many and alter the shape of the final object', () => {
      const env = new Env({ keyToJsProp: true });

      interface JwtOptions {
        secret: string;
        signOptions: {
          iss: string;
          algorithm: string;
        };
      }

      function toJwtOptions({
        secret,
        iss,
        algorithm,
      }: EnvManyResult): JwtOptions {
        return {
          secret,
          signOptions: {
            iss,
            algorithm,
          },
        };
      }

      const jwtOptions = env.provideMany(
        [
          { key: 'JWT_SECRET', keyTo: [() => 'secret'], defaultValue: 'token' },
          {
            key: 'JWT_ALGORITHM',
            keyTo: () => 'algorithm',
            defaultValue: 'RSA',
          },
          {
            key: 'JWT_ISSUER',
            keyTo: 'iss',
            defaultValue: 'something',
          },
        ],
        toJwtOptions
      );

      expect(jwtOptions.secret).to.equal('token');
      expect(jwtOptions.signOptions).to.be.an('object');
      expect(jwtOptions.signOptions.algorithm).to.equal('RSA');
      expect(jwtOptions.signOptions.iss).to.equal('something');
    });
  });

  describe('Environments', () => {
    it('should provide a boolean based on if production environment', () => {
      const env = new Envirator();

      env.setEnv('NODE_ENV', 'test');
      expect(env.isProduction).to.be.false;

      env.setEnv('NODE_ENV', 'production');
      expect(env.isProduction).to.be.true;

      env.setEnv('NODE_ENV', 'development');
      expect(env.isProduction).to.be.false;

      env.setEnv('NODE_ENV', 'staging');
      expect(env.isProduction).to.be.false;
    });

    it('should provide a boolean based on if staging environment', () => {
      const env = new Envirator();

      env.setEnv('NODE_ENV', 'test');
      expect(env.isStaging).to.be.false;

      env.setEnv('NODE_ENV', 'production');
      expect(env.isStaging).to.be.false;

      env.setEnv('NODE_ENV', 'development');
      expect(env.isStaging).to.be.false;

      env.setEnv('NODE_ENV', 'staging');
      expect(env.isStaging).to.be.true;
    });

    it('should provide a boolean based on if development environment', () => {
      const env = new Envirator();

      env.setEnv('NODE_ENV', 'test');
      expect(env.isDevelopment).to.be.false;

      env.setEnv('NODE_ENV', 'production');
      expect(env.isDevelopment).to.be.false;

      env.setEnv('NODE_ENV', 'development');
      expect(env.isDevelopment).to.be.true;

      env.setEnv('NODE_ENV', 'staging');
      expect(env.isDevelopment).to.be.false;
    });

    it('should provide a boolean based on if test environment', () => {
      const env = new Envirator();

      env.setEnv('NODE_ENV', 'test');
      expect(env.isTest).to.be.true;

      env.setEnv('NODE_ENV', 'production');
      expect(env.isTest).to.be.false;

      env.setEnv('NODE_ENV', 'development');
      expect(env.isTest).to.be.false;

      env.setEnv('NODE_ENV', 'staging');
      expect(env.isTest).to.be.false;
    });

    it('should allow environment name overrides', () => {
      const nodeEnv = 'NODE_ENV';
      const test = 'TESTs';
      const production = 'Prod';
      const staging = 'Stagings';
      const development = 'DevelopMents';

      const env = new Envirator({
        envs: {
          test,
          staging,
          production,
          development,
        },
      });

      env.setEnv(nodeEnv, 'test');
      expect(env.isTest).to.be.false;

      env.setEnv(nodeEnv, 'production');
      expect(env.isProduction).to.be.false;

      env.setEnv(nodeEnv, 'development');
      expect(env.isDevelopment).to.be.false;

      env.setEnv(nodeEnv, 'staging');
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
});
