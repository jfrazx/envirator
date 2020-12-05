import { EnvOptionsContainer } from '../src/options';
import { Environment } from '../src/enums';
import { expect } from 'chai';

describe('EnvOptionsContainer', () => {
  describe('General', () => {
    it('should supply default values', () => {
      const options = new EnvOptionsContainer();
      const { envs, doNotWarnIn } = options;
      const [prod] = doNotWarnIn;

      expect(options.productionDefaults).to.be.false;
      expect(options.warnOnly).to.be.false;
      expect(options.logger).to.equal(console);
      expect(options.nodeEnv).to.equal('NODE_ENV');
      expect(options.noDefaultEnv).to.be.false;
      expect(options.keyToJsProp).to.be.false;
      expect(options.defaultEnv).to.equal('development');
      expect(envs).to.be.an('object');
      expect(Object.keys(envs)).to.have.lengthOf(4);

      expect(doNotWarnIn).to.be.an('array');
      expect(doNotWarnIn).to.have.lengthOf(1);
      expect(prod).to.equal(Environment.Production);

      expect(envs.development).to.equal(Environment.Development);
      expect(envs.production).to.equal(Environment.Production);
      expect(envs.staging).to.equal(Environment.Staging);
      expect(envs.test).to.equal(Environment.Test);
    });

    it('should allow defaults to be overriden', () => {
      const options = new EnvOptionsContainer({
        productionDefaults: true,
        warnOnly: true,
        logger: {
          warn: console.log,
          error: console.error,
        },
        nodeEnv: 'NODE_ENVIRONMENT',
        noDefaultEnv: true,
        keyToJsProp: true,
        doNotWarnIn: [Environment.Test, Environment.Staging],
      });

      const { doNotWarnIn } = options;
      expect(doNotWarnIn).to.be.an('array');
      expect(doNotWarnIn).to.have.lengthOf(2);
      expect(doNotWarnIn).to.include(Environment.Test);
      expect(doNotWarnIn).to.include(Environment.Staging);
      expect(doNotWarnIn).to.not.include(Environment.Production);

      expect(options.productionDefaults).to.be.true;
      expect(options.warnOnly).to.be.true;
      expect(options.logger).to.not.equal(console);
      expect(options.nodeEnv).to.equal('NODE_ENVIRONMENT');
      expect(options.defaultEnv).to.equal('');
      expect(options.noDefaultEnv).to.be.true;
      expect(options.keyToJsProp).to.be.true;
    });

    it('should allow overriding of the default environment', () => {
      const options = new EnvOptionsContainer({
        defaultEnv: Environment.Production,
      });

      expect(options.defaultEnv).to.equal(Environment.Production);
    });
  });

  describe('Environments', () => {
    it('should allow overriding the predefined environments', () => {
      const test = 'TESTable';
      const production = 'Prod';
      const development = 'Develop';
      const staging = 'Staging';

      const opts = new EnvOptionsContainer({
        envs: {
          production,
          development,
          staging,
          test,
        },
      });

      const {
        envs,
        doNotWarnIn: [prod],
      } = opts;

      expect(envs.development).to.equal(development.toLowerCase());
      expect(envs.production).to.equal(production.toLowerCase());
      expect(envs.staging).to.equal(staging.toLowerCase());
      expect(envs.test).to.equal(test.toLowerCase());

      expect(prod).to.equal(envs.production);
    });

    it('should allow overriding of the default environment with defined environments', () => {
      const test = 'TESTable';
      const production = 'Prod';
      const development = 'Develop';
      const staging = 'Staging';

      const options = new EnvOptionsContainer({
        defaultEnv: Environment.Production,
        envs: {
          production,
          development,
          staging,
          test,
        },
      });

      expect(options.defaultEnv).to.equal('prod');
    });

    it('should allow creating new environments', () => {
      const { envs } = new EnvOptionsContainer({
        envs: {
          alternate: 'alternative',
          wat: 'wat',
        },
      });

      expect(envs.alternate).to.equal('alternative');
      expect(envs.wat).to.equal('wat');
    });
  });
});