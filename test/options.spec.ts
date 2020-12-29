import { EnvOptionsContainer } from '../src/options';
import { Environment } from '../src/enums';
import { expect } from 'chai';

describe('EnvOptionsContainer', () => {
  describe('General', () => {
    it('should supply default values', () => {
      const options = new EnvOptionsContainer();
      const { environments, doNotWarnIn } = options;
      const [prod] = doNotWarnIn;

      expect(options.productionDefaults).to.be.false;
      expect(options.warnOnly).to.be.false;
      expect(options.logger).to.equal(console);
      expect(options.nodeEnv).to.equal('NODE_ENV');
      expect(options.noDefaultEnv).to.be.false;
      expect(options.camelcase).to.be.false;
      expect(options.allowEmptyString).to.be.true;
      expect(options.defaultEnv).to.equal('development');
      expect(environments).to.be.an('object');
      expect(Object.keys(environments)).to.have.lengthOf(4);

      expect(doNotWarnIn).to.be.an('array');
      expect(doNotWarnIn).to.have.lengthOf(1);
      expect(prod).to.equal(Environment.Production);

      expect(environments.development).to.equal(Environment.Development);
      expect(environments.production).to.equal(Environment.Production);
      expect(environments.staging).to.equal(Environment.Staging);
      expect(environments.test).to.equal(Environment.Test);
    });

    it('should allow defaults to be overridden', () => {
      const options = new EnvOptionsContainer({
        productionDefaults: true,
        allowEmptyString: false,
        warnOnly: true,
        logger: {
          warn: console.log,
          error: console.error,
        },
        nodeEnv: 'NODE_ENVIRONMENT',
        noDefaultEnv: true,
        camelcase: true,
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
      expect(options.allowEmptyString).to.be.false;
      expect(options.nodeEnv).to.equal('NODE_ENVIRONMENT');
      expect(options.defaultEnv).to.equal('');
      expect(options.noDefaultEnv).to.be.true;
      expect(options.camelcase).to.be.true;
    });

    it('should allow overriding of the default environment', () => {
      const options = new EnvOptionsContainer({
        defaultEnv: Environment.Production,
      });

      expect(options.defaultEnv).to.equal(Environment.Production);
    });
  });

  describe('Deprecated', () => {
    it('should assign deprecated keyToJsProp option to camelcase', () => {
      const options = new EnvOptionsContainer({
        keyToJsProp: true,
      });

      expect(options.camelcase).to.be.true;
    });

    it('should prioritize camelcase over keyToJsProp', () => {
      const options = new EnvOptionsContainer({
        camelcase: false,
        keyToJsProp: true,
      });

      expect(options.camelcase).to.be.false;
    });

    it('should assign deprecated envs option to environments', () => {
      const options = new EnvOptionsContainer({
        envs: {
          development: 'develop',
        },
      });

      expect(options.environments.development).to.be.equal('develop');
    });

    it('should prioritize environments over envs', () => {
      const options = new EnvOptionsContainer({
        envs: {
          development: 'develop',
        },
        environments: {
          development: 'in-development',
        },
      });

      expect(options.environments.development).to.be.equal('in-development');
    });
  });

  describe('Environments', () => {
    it('should allow overriding the predefined environments', () => {
      const test = 'TESTable';
      const production = 'Prod';
      const development = 'Develop';
      const staging = 'Staging';

      const opts = new EnvOptionsContainer({
        environments: {
          production,
          development,
          staging,
          test,
        },
      });

      const {
        environments,
        doNotWarnIn: [prod],
      } = opts;

      expect(environments.development).to.equal(development.toLowerCase());
      expect(environments.production).to.equal(production.toLowerCase());
      expect(environments.staging).to.equal(staging.toLowerCase());
      expect(environments.test).to.equal(test.toLowerCase());

      expect(prod).to.equal(environments.production);
    });

    it('should allow overriding of the default environment with defined environments', () => {
      const test = 'TESTable';
      const production = 'Prod';
      const development = 'Develop';
      const staging = 'Staging';

      const options = new EnvOptionsContainer({
        defaultEnv: Environment.Production,
        environments: {
          production,
          development,
          staging,
          test,
        },
      });

      expect(options.defaultEnv).to.equal('prod');
    });

    it('should allow creating new environments', () => {
      const { environments } = new EnvOptionsContainer({
        environments: {
          alternate: 'alternative',
          wat: 'wat',
        },
      });

      expect(environments.alternate).to.equal('alternative');
      expect(environments.wat).to.equal('wat');
    });
  });
});
