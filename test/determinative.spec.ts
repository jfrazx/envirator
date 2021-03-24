import { Determinative } from '../src/determinative';
import { expect } from 'chai';

describe('Determinative', () => {
  const options: any = {
    allowEmptyString: true,
    productionDefaults: true,
  };
  let originalEnv: any;

  before(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should override the given value: NaN', () => {
    const env: any = {
      isProduction: false,
      currentEnv: 'development',
    };

    const determine = new Determinative(env, options);

    const value = determine.environmentOverride(NaN, {
      defaultValue: 500,
      envOverride: isNaN,
    });

    expect(value).to.be.equal(500);
  });

  it('should override the given value: 500', () => {
    const env: any = {
      isProduction: false,
      currentEnv: 'development',
    };

    const determine = new Determinative(env, options);

    const value = determine.environmentOverride(500, {
      defaultValue: 100,
      envOverride: [
        isNaN,
        (value: number) => !Number.isInteger(value),
        (value: number) => value < 1,
        (value: number) => value > 100,
      ],
    });

    expect(value).to.be.equal(100);
  });

  it('should not override the given value: 50', () => {
    const env: any = {
      isProduction: false,
      currentEnv: 'development',
    };

    const determine = new Determinative(env, options);

    const value = determine.environmentOverride(50, {
      defaultValue: 100,
      envOverride: [
        isNaN,
        (value: number) => !Number.isInteger(value),
        (value: number) => value < 1,
        (value: number) => value > 100,
      ],
    });

    expect(value).to.be.equal(50);
  });
});
