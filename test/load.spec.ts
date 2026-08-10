import { Envirator, EnvironmentConfigError } from '../src';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { join } from 'path';

describe('LoadConfig', () => {
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
    const empty1 = envirator.provide('I_AM_EMPTY_STRING');

    expect(value).to.be.undefined;
    expect(sess).to.be.undefined;
    expect(empty1).to.be.undefined;

    envirator.load(join(__dirname, '.env.development'));

    const port = envirator.provide('PORTZ', { logger: console });
    const session = envirator.provide('SESSIONZ');
    const empty = envirator.provide('I_AM_EMPTY_STRING');

    expect(port).to.not.be.undefined;
    expect(port).to.equal('5200');

    expect(session).to.not.be.undefined;
    expect(session).to.equal('thisissession');

    expect(empty).to.not.be.undefined;
    expect(empty).to.equal('');
  });

  it('should not write to stdout when loading a config', () => {
    const write = sinon.stub(process.stdout, 'write').returns(true);
    const env = new Envirator();

    try {
      env.load(join(__dirname, '.env.development'));
    } finally {
      write.restore();
    }

    sinon.assert.notCalled(write);
  });

  it('should allow the caller to re-enable dotenv output', () => {
    const write = sinon.stub(process.stdout, 'write').returns(true);
    const env = new Envirator();

    try {
      env.load(join(__dirname, '.env.development'), {
        config: { quiet: false },
      });
    } finally {
      write.restore();
    }

    sinon.assert.called(write);
  });

  it('should throw if config loading fails', () => {
    const envirator = new Envirator();

    expect(() => envirator.load('config.fail')).to.throw(
      EnvironmentConfigError,
      `Failed to load environment config 'config.fail': Error: ENOENT: no such file or directory, open 'config.fail'`
    );

    sinon.assert.notCalled(process.exit as any);
    sinon.assert.notCalled(console.error as sinon.SinonStub);
  });

  it('should expose the path and cause on the thrown error', () => {
    const envirator = new Envirator();

    try {
      envirator.load('config.fail');
      expect.fail('expected load to throw');
    } catch (error) {
      expect(error).to.be.instanceOf(EnvironmentConfigError);
      expect((error as EnvironmentConfigError).path).to.equal('config.fail');
      expect((error as EnvironmentConfigError).cause).to.be.instanceOf(Error);
    }
  });

  it('should throw when loading and noDefaultEnv is set', () => {
    const env = new Envirator({
      noDefaultEnv: true,
      logger: {
        warn: () => {},
        error: console.error,
      },
    });

    expect(() => env.load()).to.throw(
      EnvironmentConfigError,
      `Failed to load environment config '.env': Error: ENOENT: no such file or directory, open '.env'`
    );
  });
});
