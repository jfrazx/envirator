# Envirator

Ensure environment variable availability during program initialization.

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

If `PORT` exists it will be of type `string`. Otherwise, a message will print to the console and immediately exit.

`Envirator` may also be imported by its alias: `Env`.

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

| Option             | Type                                                            | Default Value             | Description                                                                                                               |
| ------------------ | --------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| nodeEnv            | string                                                          | NODE_ENV                  | Change where to locate the Node environment.                                                                              |
| logger             | EnvLogger                                                       | console                   | Prints warning and error messages to the terminal.                                                                        |
| environments       | Environments                                                    | { [key: string]: string } | An object that allows overriding of `production`, `development`, `test` and `staging` strings                             |
| defaultEnv         | string                                                          | development               | Designate the default environment. This should be a key from the `environments` option.                                   |
| noDefaultEnv       | boolean                                                         | false                     | Specify if you do not want to provide a default environment if one is not set.                                            |
| allowEmptyString   | boolean                                                         | true                      | Specify if an empty string is an acceptable environment variable value.                                                   |
| productionDefaults | boolean                                                         | false                     | Specifies if supplied default values should be allowed in a production environment.                                       |
| warnOnly           | boolean                                                         | false                     | Warn of missing environment variables rather than exit. Does nothing in production environment.                           |
| suppressWarnings   | boolean \| string[] \| (key: string, env: Envirator) => boolean | false                     | Specify if warning output should be suppressed.                                                                           |
| camelcase          | boolean                                                         | false                     | If true, when calling provideMany, the requested environment variable key will be transformed to camelcase.               |
| doNotWarnIn        | string[]                                                        | [production]              | An array of Environment strings in which `warnOnly` is ignored and missing environment variables will force program exit. |

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
If the file does not exist Envirator will exit the program.

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

A warning is issued to the console rather than immediately exiting, unless the environment is production.

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
