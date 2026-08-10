# Envirator

[![Tests](https://github.com/jfrazx/envirator/actions/workflows/tests.yml/badge.svg)](https://github.com/jfrazx/envirator/actions/workflows/tests.yml)
[![CodeQL](https://github.com/jfrazx/envirator/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/jfrazx/envirator/actions/workflows/codeql-analysis.yml)
[![npm version](https://img.shields.io/npm/v/@status/envirator.svg)](https://www.npmjs.com/package/@status/envirator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Ensure environment variable availability during program initialization.

Ships both CommonJS and ES module builds with TypeScript declarations for each.
Requires Node 20 or later.

---

## Install

npm:  
`npm install @status/envirator`

yarn:  
`yarn add @status/envirator`

---

## Usage

Use `Envirator` to provide and manipulate environment variables.

```typescript
import { Envirator } from '@status/envirator';

const env = new Envirator();

const port = env.provide('PORT');
```

If `PORT` exists it will be of type `string`. Otherwise a `MissingEnvironmentError` is thrown, which
ends startup immediately unless the application catches it.

`Envirator` may also be imported by its alias: `Env`.

### Errors

A missing required variable throws `MissingEnvironmentError`, carrying every missing key on `keys`
so consumers can branch on the failure without parsing the message:

```typescript
import { createEnv, MissingEnvironmentError } from '@status/envirator';

const env = createEnv();

try {
  const config = env.provideMany(['DB_HOST', 'DB_USER', 'DB_PASSWORD']);
} catch (error) {
  if (error instanceof MissingEnvironmentError) {
    console.error(`missing: ${error.keys.join(', ')}`);
  }
  throw error;
}
```

`provideMany` collects **every** missing key and throws once, so an environment missing five
variables is diagnosed in a single run rather than five.

A config file that fails to load throws `EnvironmentConfigError`, which exposes the attempted
`path` and the underlying error as `cause`. Both extend `EnviratorError`.

#### Supplying a failure policy

Envirator throws rather than exiting, which keeps the failure diagnosable, catchable and testable.
An uncaught error still terminates the process with status 1, so fail-fast startup behaviour is
unchanged.

If the application wants to decide process lifetime itself, supply `onError`. It receives the error
before it is thrown:

```typescript
const env = createEnv({
  onError: (error) => {
    console.error(error.message);
    process.exit(1);
  },
});
```

`onError` may also be passed per call to `provide` and `load`. If the handler returns rather than
terminating, the error is still thrown.

### Initialization

Upon initialization you may specify several options:

```typescript
import { Envirator, EnvInitOptions } from '@status/envirator';

import * as winston from 'winston';

const envOpts: EnvInitOptions = {
  warnOnly: true,
  logger: winston,
  camelcase: true,
  noDefaultEnv: true,
  suppressWarnings: true,
  allowEmptyString: false,
  defaultEnv: 'production',
  productionDefaults: true,
  doNotWarnIn: ['production'],
  nodeEnv: 'NODE_ENVIRONMENT',
};

const env = new Envirator(envOpts);
```

You may override the default environment strings on initialization or provide custom environments:

```typescript
const env = new Env({
  environments: {
    test: 'testing',
    staging: 'staged',
    production: 'prod',
    development: 'develop',
    custom: 'custom_env',
  },
});
```

Be aware that values will be lower-cased.

### Initialization Options

| Option             | Type                                                            | Default Value             | Description                                                                                                 |
| ------------------ | --------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| nodeEnv            | string                                                          | NODE_ENV                  | Change where to locate the Node environment.                                                                |
| logger             | EnvLogger                                                       | console                   | Prints warning and error messages to the terminal.                                                          |
| environments       | Environments                                                    | { [key: string]: string } | An object that allows overriding of `production`, `development`, `test` and `staging` strings               |
| defaultEnv         | string                                                          | development               | Designate the default environment. This should be a key from the `environments` option.                     |
| noDefaultEnv       | boolean                                                         | false                     | Specify if you do not want to provide a default environment if one is not set.                              |
| allowEmptyString   | boolean                                                         | true                      | Specify if an empty string is an acceptable environment variable value.                                     |
| productionDefaults | boolean                                                         | false                     | Specifies if supplied default values should be allowed in a production environment.                         |
| warnOnly           | boolean                                                         | false                     | Warn of missing environment variables rather than throw. Does nothing in production environment.            |
| suppressWarnings   | boolean \| string[] \| (key: string, env: Envirator) => boolean | false                     | Specify if warning output should be suppressed.                                                             |
| camelcase          | boolean                                                         | false                     | If true, when calling provideMany, the requested environment variable key will be transformed to camelcase. |
| doNotWarnIn        | string[]                                                        | [production]              | An array of Environment strings in which `warnOnly` is ignored and missing environment variables throw.     |
| onError            | (error: EnviratorError) => void                                 | undefined                 | Supplies the failure policy. Receives the error before it is thrown.                                        |

### Configs

Load a config by specifying a path or based on the current environment.

```typescript
import { Envirator } from '@status/envirator';

const env = new Envirator();

// environment based config loading
env.load();

// or

env.load('./path/to/config');
```

Environment based loading expects a file named `.env.environment` in the root of your project. For example, a development based environment would attempt to load `.env.development`.  
If the file does not exist Envirator throws an `EnvironmentConfigError`.

### Environment Variables

Providing environment variables is what Envirator does best! There are a few options you may pass to alter behavior.

```typescript
import { Envirator, EnvOptions } from '@status/envirator';
import * as winston from 'winston';

const env = new Envirator();

const envOpts: EnvOptions = {
  warnOnly: true,
  logger: winston,
  defaultValue: 4800,
  mutators: parseInt,
  allowEmptyString: false,
  productionDefaults: true,
};

const port = env.provide<number>('PORT', envOpts);
```

In addition to options previously discussed (warnOnly, logger, productionDefaults, allowEmptyString), you may provide a default value for use in the event an environment variable does not exist.  
A single function or an array of functions may be passed to modify the extracted value (`mutators`).

You may have different default values based on the current environment. Overridden environments may be used.

```typescript
const envOpts: EnvOptions = {
  defaultsFor: {
    testable: 7623,
    staging: 9999,
    dev: 6543,
  },
  warnOnly: true,
  productionDefaults: false,
};
```

Providing a default with environment based defaults will utilize the more specific environment, if preset.

```typescript
const envOpts: EnvOptions = {
  defaultValue: 1234,
  defaultsFor: {
    testable: 7623,
    staging: 9999,
    dev: 6543,
  },
  warnOnly: true,
};
```

---

Often you may need many environment variables.

```typescript
import { EnvManyOptions } from '@status/envirator';

const envVar: EnvManyOptions = {
  key: 'SOME_VAR',
  warnOnly: true,
  camelcase: true,
  defaultValue: 3400,
  defaultsFor: { ... },
  mutators: parseInt,
  productionDefaults: false,
};

const { NODE_ENV, someVar, CONTENT: content } = env.provideMany([
  'NODE_ENV',
  envVar,
  { key: 'CONTENT' },
]);
```

Additionally you may wish to change the property or the entire shape of the returned object.

```typescript
const env = new Env({ camelcase: true });

interface JwtOptions {
  secret: string;
  signOptions: {
    issuer: string;
    algorithm: string;
  };
}

function toJwtOptions({
  secret,
  issuer,
  algorithm,
}: EnvManyResult): JwtOptions {
  return {
    secret,
    signOptions: {
      algorithm,
      issuer,
    },
  };
}

const jwtOptions: JwtOptions = env.provideMany(
  [
    { key: 'JWT_SECRET', keyTo: [() => 'secret'], defaultValue: 'token' },
    {
      key: 'JWT_ALGORITHM',
      keyTo: (key) => 'algorithm',
      defaultValue: 'RSA',
    },
    {
      key: 'JWT_ISSUER',
      keyTo: 'issuer',
      defaultValue: 'something',
    },
  ],
  toJwtOptions
);
```

### Set Values

You may set environment variables by passing an object or a single key value pair.

```typescript
import { Envirator } from '@status/envirator';

const env = new Envirator();

env.setEnv('NODE_ENV', 'development');

const envVars = {
  PORT: 5200,
  SESSION: 'session-key',
  COOKIE: 'cookie-monster',
};

env.set(envVars);
```

All values are set as strings. No checks are made to ensure the key currently does not exist.

### Properties

Envirator has several handy properties that indicate if the current environment is either `production`, `development`, `staging` or `test`.

```typescript
if (env.isProduction) {
  // do stuff
}
if (env.isDevelopment) {
  // do stuff
}
if (env.isStaging) {
  // do stuff
}
if (env.isTest) {
  // do stuff
}
```

Each has a negated counterpart, which reads better than negating the positive form:

```typescript
if (env.isNotProduction) {
  // do stuff
}
if (env.isNotDevelopment) {
  // do stuff
}
if (env.isNotStaging) {
  // do stuff
}
if (env.isNotTest) {
  // do stuff
}
```

Envirator can be extended if you want to use custom environment helpers:

```typescript
class CustomEnv extends Envirator {
  constructor({ environments = {}, ...options }: EnvInitOptions = {}) {
    super({
      ...options,
      defaultEnv: 'custom',
      environments: { custom: 'my_custom_env', ...environments },
    });
  }

  get isCustom() {
    return this.currentEnv === this.options.environments.custom;
  }
}
```

You can retrieve or set the current environment:

```typescript
env.currentEnv;
// => development or whatever the current environment may be (always lowercase)

env.currentEnv = 'test';
// equivalent to 'envirator.setEnv('NODE_ENV', 'test');' NODE_ENV is whatever was set at initialization
```

---

## Examples

Perhaps in your local development environment you don't have a database user/password.

```typescript
import { Env } from '@status/envirator';

const env = new Env({ camelcase: true });

const { dbUser, dbPassword } = env.provideMany([
  { key: 'DB_USER', warnOnly: true },
  { key: 'DB_PASSWORD', warnOnly: true },
]);
```

A warning is issued to the console rather than throwing, unless the environment is production.

\---

Or setting a pool size

```typescript
const mongoPool = env.provide<number>('MONGO_POOL', {
  defaultValue: 15,
  mutators: parseInt,
  productionDefaults: true,
});
```

\---

Create a config that includes envirator to provide in other files.

```typescript
export const config = {
  port: env.provide<number>('PORT', { mutators: parseInt }),
  environment: env.currentEnv,
  env,
};

// elsewhere
import { config } from './config';

const { env } = config;

const dbPass = env.provide('DB_PASSWORD', { warnOnly: true });
```

Modify the built-in environments and disallow warnings.

```typescript
const env = new Envirator({
  environments: {
    production: 'prod',
    development: 'develop',
  },
  warnOnly: true,
  doNotWarnIn: ['prod', 'staging'],
});
```

---

## Migrating to v2

**Missing variables throw instead of exiting.**

`provide`, `provideMany`, `load` and `currentEnv` previously logged a red `[ENV ERROR]` line and
called `process.exit(1)`. On a piped stdout that exit discarded the buffered log line, so the
message meant to explain the failure was frequently the thing that got dropped. They now throw
instead.

An uncaught error still exits with status 1, so no orchestrator contract changes. If code relied
on the process dying inside the call, either catch the error or supply `onError`:

```typescript
const env = createEnv({
  onError: (error) => {
    console.error(error.message);
    process.exit(1);
  },
});
```

**Failures are no longer logged.** An uncaught error prints itself; logging as well meant every
failure was reported twice in two formats. `logger` is now used only for warnings.

**`provideMany` reports every missing key at once** rather than dying on the first.

**The deprecated `envs` and `keyToJsProp` options are removed.** Use `environments` and
`camelcase` instead -- they accept the same values and have been the documented spelling for
several releases.

```typescript
// before
new Envirator({ envs: { staging: 'staged' }, keyToJsProp: true });

// after
new Envirator({ environments: { staging: 'staged' }, camelcase: true });
```

**Protected methods renamed**, which affects subclasses only: `exit(message, logger)` is now
`fail(error, onError?)`, and `exitOrWarn(...)` is now `failOrWarn(...)` and returns a boolean.

**Packaging.** The package now ships ESM alongside CommonJS via an `exports` map, and declares
`engines.node >= 20`. Deep imports into `dist/**` are no longer resolvable -- import from the
package root.
