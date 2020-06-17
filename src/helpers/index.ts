import { asArray } from '@jfrazx/asarray';
import { KeyTo } from '../interfaces';
import camelcase from 'camelcase';

const is = (type: string, value: any): boolean => typeof value === type;

export const toLowerCase = (value: string) => value.toLowerCase().trim();
export const isString = (value: any): value is string => is('string', value);

export const isUndefined = (value: any): value is undefined =>
  is('undefined', value);

export const isObject = (value: any): value is object =>
  value && !Array.isArray(value) && is('object', value);

export const determineKey = (
  key: string,
  toJsProp: boolean,
  keyTo: string | KeyTo | KeyTo[]
): string => {
  const use = isString(keyTo) ? [() => keyTo] : asArray(keyTo);
  return mutateProperty(key, toJsProp ? [camelcase, ...use] : use);
};

const mutateProperty = (key: string, mutators: KeyTo[]): string =>
  mutators.reduce((k, mutator) => mutator(k), key);
