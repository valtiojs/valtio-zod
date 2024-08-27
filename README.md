# valtio-zod

Validate your [valtio](https://github.com/pmndrs/valtio) store values with [Zod](https://zod.dev/)

## What is this

[valtio](https://github.com/pmndrs/valtio) is
a proxy state library for ReactJS and VanillaJS.

[Zod](https://zod.dev/) is a TypeScript-first
schema validation library with static type inference.

valtio-zod is an attempt to make validating your store values
with zod as easy as possible.

## Project Status

Planning and early development. We are still trying to iron out details on how best to implement this. All ideas and feedback
are welcome and strongly encouraged.

## How to use it

**Note:** This is a work in progress. The API is likely to change. This has not been published to npm yet.

```js
import { schema } from 'valtio-zod'

const userSchema = z.object({
  name: z.string(),
  age: z.number()
})

const userState = schema(userSchema).proxy({
  name: 'John Doe',
  age: 30
})

userState.name = 'Jane Doe'
// userState.name = 'Jane Doe'

userState.name = 55 // Error
// userState.name = 'Jane Doe'
```

## API

### Basic

#### `schema(zodSchema)`

This function takes a ZodSchema and returns a on object that has a `proxy`
function that returns a proxy that can be used to trap the values being set on the proxy
and validate them against the ZodSchema before passing them on to the valtio store.

```js
import { schema } from 'valtio-zod'

const userSchema = z.object({
  name: z.string(),
  age: z.number()
})

const userState = schema(userSchema).proxy({
  name: 'John Doe',
  age: 30
})
```

#### Config Symbols

##### parseAsync

This symbol is used to configure how the schema is parsed. You can attaach
it to the schema object as a property. It will be omitted from the final schema object.

```js
import { schema, parseAsync } from 'valtio-zod'

const promiseSchema = z.object({
  name: z.promise(z.string()),
  [parseAsync]: true
})

const userState = schema(promiseSchema).proxy({
  name: Promise.resolve('Jane Doe')
})

userState.name = 'Jane Doe'
// userState.name = 'Jane Doe'

userState.name = 55 // Error
// userState.name = 'Jane Doe'
```

##### parseSafe

This symbol is used to configure how the schema is parsed.
You can attaach it to the schema object as a property. It will be omitted from the final schema object.

```js
import { schema, parseSafe } from 'valtio-zod'

const userSchema = z.object({
  name: z.string(),
  [parseSafe]: true
})

const userState = schema(userSchema).proxy({
  name: 'John Doe',
  age: 30
})

userState.name = 'Jane Doe'
// userState.name = 'Jane Doe'

userState.name = 55 // Error
// this will call the errorHandler function without throwing an error
// userState.name = 'Jane Doe'
```

##### errorHandler

This symbol is used to configure how errors are handled.
You can attaach it to the schema object as a property. It will be omitted from the final schema object.
This function is called with the error object when the schema is invalid.
This way you can use your own error handling logic alongside Zod.Error

```js
import { schema, errorHandler } from 'valtio-zod'

const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  [errorHandler]: (error) => {
    console.error(error)
  }
})
```

##### globalConfig

This is the global config that can be used to configure how a schema if
no value is provided for the schema. It a convenience for setting the
default values for all that can be overridden by each schema. The only
symbols currently supported are `parseSafe` and `errorHandler`.

```js
import { globalConfig, parseSafe, errorHandler } from 'valtio-zod'

globalConfig[parseSafe] = true
globalConfig[errorHandler] = (error) => {
  console.error(error)
}
```
