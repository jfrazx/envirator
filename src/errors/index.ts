/**
 * Base class for all errors thrown by Envirator
 *
 * @export
 * @class EnviratorError
 * @extends {Error}
 */
export class EnviratorError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);

    this.name = new.target.name;
  }
}

/**
 * Thrown when one or more required environment variables are missing
 *
 * @export
 * @class MissingEnvironmentError
 * @extends {EnviratorError}
 */
export class MissingEnvironmentError extends EnviratorError {
  constructor(readonly keys: string[]) {
    super(
      `Missing environment variable${keys.length === 1 ? '' : 's'}: ${keys
        .map((key) => `'${key}'`)
        .join(', ')}`
    );
  }
}

/**
 * Thrown when an environment config file fails to load
 *
 * @export
 * @class EnvironmentConfigError
 * @extends {EnviratorError}
 */
export class EnvironmentConfigError extends EnviratorError {
  constructor(
    readonly path: string,
    error: Error
  ) {
    super(`Failed to load environment config '${path}': ${error}`, {
      cause: error,
    });
  }
}
