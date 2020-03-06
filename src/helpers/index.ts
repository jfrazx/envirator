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
