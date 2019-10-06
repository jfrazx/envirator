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

const envirator = new Envirator();

const port = envirator.provide('PORT');
```

If `PORT` exists it will be of type `string`. Otherwise, a message will print to the console and immediately exit.

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
};

const envirator = new Envirator(envOpts);
```

### Initialization Options

- `logger: EnvLogger` :: Prints warning and error messages to the terminal. Default is `console` object.
- `warnOnly: boolean` :: Warn of missing environment variables rather than exit. Does nothing in production environment. Default is `false`
- `productionDefaults: boolean` :: Specifies if supplied default values should be allowed in a production environment. Default is `false`
- `nodeEnv: string` :: Change where to locate the Node environment. Default is `NODE_ENV`

### Configs

Load a config by specifying a path or based on the current environment.

```typescript
import { Envirator } from '@status/envirator';

const envirator = new Envirator();

await envirator.load();

// or

await envirator.load('./path/to/config');
```

Environment based loading expects a file named `.env.environment` in the root of your project. For example, a development based environment would attempt to load `.env.development`.  
If the file does not exist Envirator will exit the program.

### Environment Variables

Providing environment variables is what Envirator does best! There are a few options you may pass to alter behavior.

```typescript
import { Envirator, EnvOptions } from '@status/envirator';
import * as winston from 'winston';

const envirator = new Envirator();

const envOpts: EnvOptions = {
  warnOnly: true,
  productionDefaults: true,
  logger: winston,
  defaultValue: 4800,
  mutators: parseInt,
};

const port = envirator.provide<number>('PORT', envOpts);
```

In addition to the three options previously discussed, you may provide a default value for use in the event an environment variable does not exist.  
A single function or an array of functions may be passed to modify the extracted value.

Often you may need many environment variables.

```typescript
import { EnvManyOptions } from '@status/codes';

const envVar: EnvManyOptions = {
  key: 'SOME_VAR',
  defaultValue: 3400,
  warnOnly: true,
  productionDefaults: false,
  mutators: parseInt,
};

const { NODE_ENV, SOME_VAR, CONTENT } = envirator.provideMany([
  'NODE_ENV',
  envVar,
  { key: 'CONTENT' },
]);
```

### Set Values

You may set environment variables by passing an object or a single key value pair.

```typescript
import { Envirator } from '@status/envirator';

const envirator = new Envirator();

envirator.setEnv('NODE_ENV', 'development');

const envVars = {
  PORT: 5200,
  SESSION: 'session-key',
  COOKIE: 'cookie-monster',
};

envirator.set(envVars);
```

All values are set as strings. No checks are made to ensure the key currently does not exist.

### Properties

Envirator also has a handy property that indicates if the current environment is production.

```typescript
if (envirator.isProduction) {
  // do stuff
}
```

---

## Examples

Perhaps in your local development environment you don't have a database user/password.

```typescript
import { Envirator } from '@status/envirator';

const env = new Envirator();

const { DB_USER: dbUser, DB_PASSWORD: dbPass } = env.provideMany([
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
  environment: envirator.provide('NODE_ENV'),
  port: envirator.provide('PORT', { mutators: parseInt }),
  env: envirator,
};

// elsewhere
import { config } from './config';

const { env } = config;

const dbPass = env.provide('DB_PASSWORD', { warnOnly: true });
```
