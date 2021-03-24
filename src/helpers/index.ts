const is = (type: string, value: any): boolean => typeof value === type;

export const toLowerCase = (value: string) => value.toLowerCase().trim();
export const isString = (value: any): value is string => is('string', value);
export const isEmptyString = (value: unknown): boolean =>
  isString(value) && value.trim().length === 0;

export const isUndefined = (value: any): value is undefined =>
  is('undefined', value);

export const isObject = (value: any): value is object =>
  value && !Array.isArray(value) && is('object', value);
