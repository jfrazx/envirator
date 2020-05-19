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
  logger: winston,
  warnOnly: true,
  productionDefaults: true,
  nodeEnv: 'NODE_ENVIRONMENT',
  noDefaultEnv: true,
  keyToJsProp: true,
};

const env = new Envirator(envOpts);
```

### Initialization Options

- `logger: EnvLogger` :: Prints warning and error messages to the terminal. Default is `console` object.
- `warnOnly: boolean` :: Warn of missing environment variables rather than exit. Does nothing in production environment. Default is `false`
- `productionDefaults: boolean` :: Specifies if supplied default values should be allowed in a production environment. Default is `false`
- `nodeEnv: string` :: Change where to locate the Node environment. Default is `NODE_ENV`
- `noDefaultEnv: boolean` :: Specify if you do not want to provide a default environment if one is not set. Default is `false`
- `keyToJsProp: boolean` :: If true, when calling provideMany, the requested environment variable key will be transformed to camelcase. Default is `false`
- `envs: Environments` :: An object that allows overriding of `production`, `development`, `test` and `staging` strings

### Configs

Load a config by specifying a path or based on the current environment.

```typescript
import { Envirator } from '@status/envirator';

const env = new Envirator();

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
  productionDefaults: true,
  logger: winston,
  defaultValue: 4800,
  mutators: parseInt,
};

const port = env.provide<number>('PORT', envOpts);
```

In addition to the three options previously discussed, you may provide a default value for use in the event an environment variable does not exist.  
A single function or an array of functions may be passed to modify the extracted value.

---

Often you may need many environment variables.

```typescript
import { EnvManyOptions } from '@status/envirator';

const envVar: EnvManyOptions = {
  key: 'SOME_VAR',
  defaultValue: 3400,
  warnOnly: true,
  productionDefaults: false,
  mutators: parseInt,
  keyToJsProp: true,
};

const { NODE_ENV, someVar, CONTENT: content } = env.provideMany([
  'NODE_ENV',
  envVar,
  { key: 'CONTENT' },
]);
```

Additionally you may wish to change the property or the entire shape of the returned object.

```typescript
const env = new Env({ keyToJsProp: true });

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

You may override the default strings on initializaion:

```typescript
const env = new Env({
  envs: {
    test: 'testing',
    staging: 'staged',
    production: 'prod',
    development: 'develop',
  },
});
```

Be aware that values will be lowercased.

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

const env = new Env({ keyToJsProp: true });

const { dbUser, dbPassword } = env.provideMany([
  { key: 'DB_USER', warnOnly: true },
  { key: 'DB_PASSWORD', warnOnly: true },
]);
```

A warning is issued to the console rather than immediately exiting, unless the environment is production.

\---

Or setting a pool size

```typescript
const MONGO_POOL = env.provide<number>('MONGO_POOL', {
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
