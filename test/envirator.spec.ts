import {
  Env,
  Envirator,
  EnvManyResult,
  EnvManyOptions,
  MissingEnvironmentError,
} from '../src';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { join } from 'path';
import pc from 'picocolors';

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
    sinon.stub(console, 'error');
    sinon.stub(console, 'warn');
    sinon.stub(process, 'exit');
  });

  describe('General', () => {
    it('should create envirator', () => {
      const envirator = new Envirator();

      expect(envirator).to.not.be.undefined;
      expect(envirator).to.be.instanceOf(Envirator);
    });
  });

  describe('Behavior', () => {
    describe('Fail', () => {
      it('should throw when noDefaultEnv is set to true', () => {
        const env = new Envirator({
          noDefaultEnv: true,
          warnOnly: true,
          logger: console,
        });

        expect(() => env.currentEnv).to.throw(
          MissingEnvironmentError,
          `Missing environment variable: 'NODE_ENV'`
        );

        sinon.assert.notCalled(process.exit as any);
      });

      it('should throw when noDefaultEnv is set to true and nodeEnv is empty string', () => {
        const env = new Envirator({
          noDefaultEnv: true,
          warnOnly: true,
          logger: console,
        });

        env.setEnv('NODE_ENV', '');

        expect(() => env.currentEnv).to.throw(
          MissingEnvironmentError,
          `Missing environment variable: 'NODE_ENV'`
        );

        sinon.assert.notCalled(process.exit as any);
      });

      it('should throw when allowEmptyString is set to false during initialization', () => {
        const env = new Envirator({
          allowEmptyString: false,
          logger: console,
        });

        env.setEnv('EMPTY', '');

        expect(() => env.provide('EMPTY')).to.throw(
          MissingEnvironmentError,
          `Missing environment variable: 'EMPTY'`
        );

        sinon.assert.notCalled(process.exit as any);
      });

      it('should throw when allowEmptyString is set to false during provide', () => {
        const env = new Envirator({
          logger: console,
        });

        env.setEnv('EMPTY', '     ');

        expect(() =>
          env.provide('EMPTY', { allowEmptyString: false })
        ).to.throw(
          MissingEnvironmentError,
          `Missing environment variable: 'EMPTY'`
        );

        sinon.assert.notCalled(process.exit as any);
      });

      it('should throw when allowEmptyString is set to false during provide with no envVar', () => {
        const env = new Envirator({
          allowEmptyString: false,
          logger: console,
        });

        expect(() =>
          env.provide('EMPTY', { allowEmptyString: false })
        ).to.throw(
          MissingEnvironmentError,
          `Missing environment variable: 'EMPTY'`
        );

        sinon.assert.notCalled(process.exit as any);
      });

      it('should carry the missing keys on the thrown error', () => {
        const env = new Envirator({ logger: console });

        try {
          env.provide('ABSENT');
          expect.fail('expected provide to throw');
        } catch (error) {
          expect(error).to.be.instanceOf(MissingEnvironmentError);
          expect((error as MissingEnvironmentError).keys).to.deep.equal([
            'ABSENT',
          ]);
        }
      });

      it('should not log when it throws', () => {
        const env = new Envirator({ logger: console });

        expect(() => env.provide('ABSENT')).to.throw(MissingEnvironmentError);

        sinon.assert.notCalled(console.error as any);
        sinon.assert.notCalled(console.warn as any);
      });

      it('should hand the error to onError before throwing', () => {
        const onError = sinon.stub();
        const env = new Envirator({ logger: console, onError });

        expect(() => env.provide('ABSENT')).to.throw(MissingEnvironmentError);

        sinon.assert.calledOnce(onError);
        expect(onError.firstCall.args[0]).to.be.instanceOf(
          MissingEnvironmentError
        );
      });

      it('should allow onError to supply the failure policy', () => {
        const env = new Envirator({
          logger: console,
          onError: (error) => {
            console.error(error.message);
            process.exit(1);
          },
        });

        // process.exit is stubbed here, so the handler returns and the error
        // still throws. In a real process the exit would have already happened.
        expect(() => env.provide('ABSENT')).to.throw(MissingEnvironmentError);

        sinon.assert.calledWith(process.exit as any, 1);
        sinon.assert.calledWith(
          console.error as any,
          `Missing environment variable: 'ABSENT'`
        );
      });

      it('should accept onError as a provide option', () => {
        const onError = sinon.stub();
        const env = new Envirator({ logger: console });

        expect(() => env.provide('ABSENT', { onError })).to.throw(
          MissingEnvironmentError
        );

        sinon.assert.calledOnce(onError);
      });

      it('should NOT throw when allowEmptyString is set to false during initialization, but true with provide', () => {
        const env = new Envirator({
          allowEmptyString: false,
          logger: console,
        });

        env.setEnv('EMPTY', '');

        const empty = env.provide('EMPTY', { allowEmptyString: true });

        expect(empty).to.be.equal('');

        sinon.assert.notCalled(console.error as any);
        sinon.assert.notCalled(process.exit as any);
      });
    });

    describe('Warn', () => {
      it('should warn when an env var does not exist', () => {
        const envirator = new Envirator({ warnOnly: true });

        sinon.restore();

        const warn = sinon.stub(console, 'warn');

        expect(envirator.provide('SOME_ENV_VAR')).to.be.undefined;

        sinon.assert.called(warn);
        sinon.assert.calledWith(
          warn,
          pc.yellow(`[ENV WARN]: Missing environment variable 'SOME_ENV_VAR'`)
        );
      });

      it('should warn when allowEmptyString is set to false during initialization', () => {
        const env = new Envirator({
          allowEmptyString: false,
          warnOnly: true,
          logger: console,
        });

        env.setEnv('EMPTY', '');

        const empty = env.provide('EMPTY');

        expect(empty).to.be.undefined;

        sinon.assert.called(console.warn as any);
        sinon.assert.calledWith(
          console.warn as any,
          pc.yellow(`[ENV WARN]: Missing environment variable 'EMPTY'`)
        );
        sinon.assert.notCalled(process.exit as any);
      });

      it('should warn when allowEmptyString is set to false during provide', () => {
        const env = new Envirator({
          warnOnly: true,
          logger: console,
        });

        env.setEnv('EMPTY', '');

        const empty = env.provide('EMPTY', { allowEmptyString: false });

        expect(empty).to.be.undefined;

        sinon.assert.called(console.warn as any);
        sinon.assert.calledWith(
          console.warn as any,
          pc.yellow(`[ENV WARN]: Missing environment variable 'EMPTY'`)
        );
        sinon.assert.notCalled(process.exit as any);
      });

      it('should NOT warn when allowEmptyString is set to false during initialization, but true with provide', () => {
        const env = new Envirator({
          allowEmptyString: false,
          warnOnly: true,
          logger: console,
        });

        env.setEnv('EMPTY', '');

        const empty = env.provide('EMPTY', { allowEmptyString: true });

        expect(empty).to.be.equal('');

        sinon.assert.notCalled(console.warn as any);
        sinon.assert.notCalled(process.exit as any);
      });

      it('should not output warnings when suppressed with true', () => {
        const env = new Envirator({
          suppressWarnings: true,
          warnOnly: true,
          logger: console,
        });

        const empty = env.provide('EMPTY');

        expect(empty).to.be.undefined;
        sinon.assert.notCalled(console.warn as any);
        sinon.assert.notCalled(process.exit as any);
      });

      it('should not output warnings when suppressed with true via options', () => {
        const env = new Envirator({
          warnOnly: true,
          logger: console,
        });

        const empty = env.provide('EMPTY', { suppressWarnings: true });

        expect(empty).to.be.undefined;
        sinon.assert.notCalled(console.warn as any);
        sinon.assert.notCalled(process.exit as any);
      });

      it('should not output warnings when suppressed with an array of environments', () => {
        const env = new Envirator({
          suppressWarnings: ['development', 'test'],
          warnOnly: true,
          logger: console,
        });

        const empty = env.provide('EMPTY');

        expect(empty).to.be.undefined;
        sinon.assert.notCalled(console.warn as any);
        sinon.assert.notCalled(process.exit as any);
      });

      it('should not output warnings when suppressed with an array of environments via options', () => {
        const env = new Envirator({
          warnOnly: true,
          logger: console,
        });

        const empty = env.provide('EMPTY', {
          suppressWarnings: ['development', 'test'],
        });

        expect(empty).to.be.undefined;
        sinon.assert.notCalled(console.warn as any);
        sinon.assert.notCalled(process.exit as any);
      });

      it('should not output warnings when suppressed with a function', () => {
        const env = new Envirator({
          suppressWarnings: (_key, env) => !env.isProduction,
          warnOnly: true,
          logger: console,
        });

        const empty = env.provide('EMPTY');

        expect(empty).to.be.undefined;
        sinon.assert.notCalled(console.warn as any);
        sinon.assert.notCalled(process.exit as any);
      });

      it('should not output warnings when suppressed with a function via options', () => {
        const env = new Envirator({
          warnOnly: true,
          logger: console,
        });

        const empty = env.provide('EMPTY', {
          suppressWarnings: (_key, env) => !env.isProduction,
        });

        expect(empty).to.be.undefined;
        sinon.assert.notCalled(console.warn as any);
        sinon.assert.notCalled(process.exit as any);
      });

      it('should not output warnings when suppressed via init and method options', () => {
        const env = new Envirator({
          suppressWarnings: (_key, env) => !env.isTest,
          warnOnly: true,
          logger: console,
        });

        const empty = env.provide('EMPTY', {
          suppressWarnings: ['development'],
        });

        expect(empty).to.be.undefined;
        sinon.assert.notCalled(console.warn as any);
        sinon.assert.notCalled(process.exit as any);
      });

      it('should output warnings when suppressed via init and method options with same types', () => {
        const env = new Envirator({
          suppressWarnings: ['development'],
          warnOnly: true,
          logger: console,
        });

        const empty = env.provide('EMPTY', {
          suppressWarnings: ['test'],
        });

        expect(empty).to.be.undefined;
        sinon.assert.calledOnce(console.warn as any);
        sinon.assert.notCalled(process.exit as any);
      });
    });

    it('should accept an alternate logger when instantiating', () => {
      const envirator = new Envirator({ logger: console });

      expect(() => envirator.provide('NODE_ENVZ')).to.throw(
        MissingEnvironmentError,
        `Missing environment variable: 'NODE_ENVZ'`
      );

      sinon.assert.notCalled(process.exit as any);
    });

    it('should override instantiated values', () => {
      const envirator = new Envirator({ warnOnly: true, logger: console });

      expect(envirator.provide('WAT')).to.be.undefined;

      sinon.assert.called(console.warn as any);
      sinon.assert.calledWith(
        console.warn as any,
        pc.yellow(`[ENV WARN]: Missing environment variable 'WAT'`)
      );

      expect(() => envirator.provide('WAT', { warnOnly: false })).to.throw(
        MissingEnvironmentError,
        `Missing environment variable: 'WAT'`
      );

      sinon.assert.notCalled(process.exit as any);
    });

    it('should supply the current environment', () => {
      const env = new Envirator();

      expect(env.currentEnv).to.equal('development');

      env.setEnv('NODE_ENV', 'production');
      expect(env.currentEnv).to.equal('production');

      env.currentEnv = 'test';
      expect(env.currentEnv).to.equal('test');
    });

    it('should override the default env and provide as the current environment', () => {
      const env = new Envirator({
        defaultEnv: 'production',
      });

      expect(env.currentEnv).to.equal('production');
    });

    it('should override the default env with a defined env and provide as the current environment', () => {
      const env = new Envirator({
        defaultEnv: 'something',
        environments: {
          something: 'things',
        },
      });

      expect(env.currentEnv).to.equal('things');
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
        logger: console,
      });

      envirator.setEnv('NODE_ENV', 'production');

      expect(() => envirator.provide('SOME_VAR')).to.throw(
        MissingEnvironmentError,
        `Missing environment variable: 'SOME_VAR'`
      );

      sinon.assert.notCalled(console.warn as any);
      sinon.assert.notCalled(process.exit as any);
    });

    it('should allow production defaults when initialized', () => {
      const envirator = new Envirator({
        warnOnly: true,
        logger: console,
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
        logger: console,
      });

      envirator.setEnv('NODE_ENV', 'production');

      expect(() =>
        envirator.provide('SOME_VAR', {
          defaultValue: 'someValue',
        })
      ).to.throw(MissingEnvironmentError);

      expect(
        envirator.provide('SOME_VAR', {
          defaultValue: 'someValue',
          productionDefaults: true,
        })
      ).to.equal('someValue');
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
        logger: console,
      });

      envirator.setEnv('NODE_ENV', 'production');

      expect(() =>
        envirator.provide('SOME_VAR', { defaultValue: 'someValue' })
      ).to.throw(MissingEnvironmentError);

      sinon.assert.notCalled(process.exit as any);
    });

    it('should provide environment based defaults', () => {
      const env = new Envirator({
        environments: { staging: 'staged', customEnv: 'custom' },
        logger: console,
      });

      const options = {
        defaultsFor: {
          test: 1234,
          development: 3456,
          staged: 3444,
          custom: 9999,
        },
      };

      env.currentEnv = 'test';

      const testVar = env.provide('FORT', options);
      expect(testVar).to.equal(1234);

      env.currentEnv = 'staged';

      const stagedVar = env.provide('FORT', options);
      expect(stagedVar).to.equal(3444);

      env.currentEnv = 'development';

      const devVar = env.provide('FORT', options);
      expect(devVar).to.equal(3456);

      env.currentEnv = 'custom';

      const customVar = env.provide('FORT', options);
      expect(customVar).to.equal(9999);

      env.currentEnv = 'none';

      expect(() => env.provide('FORT', options)).to.throw(
        MissingEnvironmentError,
        `Missing environment variable: 'FORT'`
      );
    });

    it('should provide environment based defaults and a default value when environment does not exist', () => {
      const env = new Envirator({
        environments: { staging: 'staged', customEnv: 'custom' },
        logger: console,
      });

      const options = {
        defaultValue: 3456,
        defaultsFor: {
          staged: 3444,
          custom: 9999,
        },
      };

      env.currentEnv = 'test';

      const testVar = env.provide('FORT', options);
      expect(testVar).to.equal(3456);

      env.currentEnv = 'staged';

      const stagedVar = env.provide('FORT', options);
      expect(stagedVar).to.equal(3444);

      env.currentEnv = 'development';

      const devVar = env.provide('FORT', options);
      expect(devVar).to.equal(3456);

      env.currentEnv = 'custom';

      const customVar = env.provide('FORT', options);
      expect(customVar).to.equal(9999);

      env.currentEnv = 'none';

      const noneVar = env.provide('FORT', options);
      expect(noneVar).to.be.equal(3456);

      sinon.assert.notCalled(console.error as any);
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
        camelcase: true,
      });

      env.setEnv('NODE_ENV', 'development');
      const opt: EnvManyOptions = {
        key: 'NODE_ENV',
        defaultValue: 'development',
        camelcase: false,
      };
      const options = [
        opt,
        { key: 'SOME_VAR', defaultValue: 'some value' },
        { key: 'UNKNOWN-VAR', defaultValue: 'unknown' },
        { key: 'UNKNOWN-VAR_CHAR', defaultValue: 'meh' },
        { key: 'keyvar', defaultValue: 'content' },
        { key: 'keyCar', defaultValue: 'con-tent', camelcase: false },
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
      const env = new Env({ camelcase: true });

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
      const env = new Env({ camelcase: true });

      interface JwtOptions {
        secret: string;
        signOptions: {
          issuer: string;
          algorithm: string;
        };
      }

      function toJwtOptions({
        secret,
        issuer,
        algorithm,
      }: EnvManyResult): JwtOptions {
        return {
          secret,
          signOptions: {
            issuer,
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
            keyTo: 'issuer',
            defaultValue: 'something',
          },
        ],
        toJwtOptions
      );

      expect(jwtOptions.secret).to.equal('token');
      expect(jwtOptions.signOptions).to.be.an('object');
      expect(jwtOptions.signOptions.algorithm).to.equal('RSA');
      expect(jwtOptions.signOptions.issuer).to.equal('something');
    });

    it('should report every missing variable in a single error', () => {
      const env = new Envirator({ logger: console });

      env.setEnv('PRESENT', 'here');

      try {
        env.provideMany(['MISSING_ONE', 'PRESENT', 'MISSING_TWO']);
        expect.fail('expected provideMany to throw');
      } catch (error) {
        expect(error).to.be.instanceOf(MissingEnvironmentError);
        expect((error as MissingEnvironmentError).keys).to.deep.equal([
          'MISSING_ONE',
          'MISSING_TWO',
        ]);
        expect((error as MissingEnvironmentError).message).to.equal(
          `Missing environment variables: 'MISSING_ONE', 'MISSING_TWO'`
        );
      }

      sinon.assert.notCalled(process.exit as any);
    });

    it('should hand the aggregated error to onError once', () => {
      const onError = sinon.stub();
      const env = new Envirator({ logger: console, onError });

      expect(() => env.provideMany(['NOPE_ONE', 'NOPE_TWO'])).to.throw(
        MissingEnvironmentError
      );

      sinon.assert.calledOnce(onError);
      expect(onError.firstCall.args[0].keys).to.deep.equal([
        'NOPE_ONE',
        'NOPE_TWO',
      ]);
    });

    it('should still warn rather than aggregate when warnOnly is set', () => {
      const env = new Envirator({ warnOnly: true, logger: console });

      const envars = env.provideMany(['ABSENT_ONE', 'ABSENT_TWO']);

      expect(envars.ABSENT_ONE).to.be.undefined;
      expect(envars.ABSENT_TWO).to.be.undefined;

      sinon.assert.calledTwice(console.warn as any);
    });
  });
});
