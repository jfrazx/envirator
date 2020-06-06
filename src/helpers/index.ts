import { asArray } from '@jfrazx/asarray';
import { KeyTo } from '../interfaces';

export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isUndefined(value: any): value is undefined {
  return typeof value === 'undefined';
}

export function isObject(value: any): value is object {
  return typeof value === 'object';
}

export function toJsProperty(key: string) {
  return key
    .split(/-|_/g)
    .map((part, index) =>
      index
        ? part.charAt(0).toUpperCase() + part.substr(1).toLowerCase()
        : part.toLowerCase()
    )
    .join('');
}

export function determineKey(
  key: string,
  toJsProp: boolean,
  keyTo: string | KeyTo | KeyTo[]
): string {
  const use = isString(keyTo) ? [() => keyTo] : asArray(keyTo);
  return mutateProperty(key, toJsProp ? [toJsProperty, ...use] : use);
}

function mutateProperty(key: string, mutators: KeyTo[]): string {
  return mutators.reduce((k, mutator) => mutator(k), key);
}
