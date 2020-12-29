import * as winstonOriginal from 'winston';
import { Envirator } from '../src';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { join } from 'path';
import chalk from 'chalk';

const winston = { ...winstonOriginal };

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
    sinon.stub(winston, 'error');
    sinon.stub(winston, 'warn');
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

    const port = envirator.provide('PORTZ', { logger: winston });
    const session = envirator.provide('SESSIONZ');
    const empty = envirator.provide('I_AM_EMPTY_STRING');

    expect(port).to.not.be.undefined;
    expect(port).to.equal('5200');

    expect(session).to.not.be.undefined;
    expect(session).to.equal('thisissession');

    expect(empty).to.not.be.undefined;
    expect(empty).to.equal('');
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
