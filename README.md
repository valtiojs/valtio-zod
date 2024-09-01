# valtio-zod ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/valtiojs/valtio-zod/ci.yml) ![NPM Version](https://img.shields.io/npm/v/valtio-zod) ![NPM License](https://img.shields.io/npm/l/valtio-zod)

Validate your [valtio](https://github.com/pmndrs/valtio) store values with [Zod](https://zod.dev/)

## What is this

[valtio](https://github.com/pmndrs/valtio) is
a proxy state library for ReactJS and VanillaJS.

[Zod](https://zod.dev/) is a TypeScript-first
schema validation library with static type inference.

valtio-zod is an attempt to make validating your store values
with zod as easy as possible.

## Installation

Zod and valtio are peer dependencies.

```bash
npm install zod valtio valtio-zod
```

## Project Status

This project is in early development. We are still trying to iron out details on how best to implement this. All ideas and feedback
are welcome and strongly encouraged.

## How to use it

```js
import { schema } from 'valtio-zod'

const userSchema = z.object({
  name: z.string(),
  age: z.number()
})

const [state, snap] = schema(userSchema).proxy({
  name: 'John Doe',
  age: 30
})

state.name = 'Jane Doe'
// state.name = 'Jane Doe'

state.name = 55 // Error
// state.name = 'Jane Doe'
```

## API

### Basic

#### `schema(zodSchema)`

This function takes a ZodSchema and returns a on object that has a `proxy`
function that returns a tuple of 2 values.

1. The proxy that can be used to trap the values being set on the valtio store and validate them against the ZodSchema before passing them along.
2. The underlying valtio store. This object is what must be used when using `useSnapshot()` to access the values in the store.

```js
import { schema } from 'valtio-zod'

const userSchema = z.object({
  name: z.string(),
  age: z.number()
})

const [state, snap] = schema(userSchema).proxy({
  name: 'John Doe',
  age: 30
})

// state is the proxy, snap is the underlying valtio store. You must use the snap object
// when you use useSnapshot()
```

### Configuration

These properties can be passed to the `proxy` function to configure how each schema is handled.
`parseSafe` and `errorHandler` are also available as properties on the `vzGlobalConfig` object
to configure the default behavior of all schemas that don't provide their own configuration.

> | property       | type                   | description                                                        |
> | -------------- | ---------------------- | ------------------------------------------------------------------ |
> | `parseAsync`   | `boolean`              | Tells zod whether or not to parse the value asynchronously         |
> | `parseSafe`    | `boolean`              | Tells zod whether or not to throw an error when a value is invalid |
> | `errorHandler` | `(error: any) => void` | A function that is called when a value is invalid                  |

#### `parseAsync` example

```js
import { schema } from 'valtio-zod'

const promiseSchema = z.object({
  name: z.promise(z.string())
})

const [state, snap] = schema(promiseSchema).proxy(
  {
    name: Promise.resolve('Jane Doe')
  },
  {
    parseAsync: true
  }
)

state.name = 'Jane Doe'
// state.name = 'Jane Doe'

userState.name = 55 // Error
// userState.name = 'Jane Doe'
```

#### `parseSafe` example

```js
import { schema } from 'valtio-zod'

const userSchema = z.object({
  name: z.string()
})

const userState = schema(userSchema).proxy(
  {
    name: 'John Doe',
    age: 30
  },
  {
    parseSafe: true
  }
)

userState.name = 'Jane Doe'
// userState.name = 'Jane Doe'

userState.name = 55 // Error
// this will call the errorHandler function without throwing an error
// userState.name = 'Jane Doe'
```

`parseSafe` is also available as a property on the `vzGlobalConfig` object

```js
import { vzGlobalConfig } from 'valtio-zod'

vzGlobalConfig.parseSafe = true
```

#### `errorHandler` example

This will allow you to use your own error handling logic (or use `Zod.Error`)

```js
import { schema, errorHandler } from 'valtio-zod'

const userSchema = z.object({
  name: z.string(),
  age: z.number()
})

const [userState] = schema(userSchema).proxy(
  {
    name: 'John Doe',
    age: 30
  },
  {
    errorHandler: (error) => {
      console.error(error)
    }
  }
)
```
