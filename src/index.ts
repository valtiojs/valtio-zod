/* eslint-disable */
import { z, ZodSchema, ZodType, ZodPromise, ZodObject } from 'zod'
import { proxy } from 'valtio'

type ValtioProxy<T> = {
  [P in keyof T]: T[P] extends ZodType<infer U, infer V, any> ? U | V : never
}

type SchemaMeta<T extends ZodSchema> = {
  parseAsync: boolean
  shape: z.infer<T>
  parseSafe: boolean
  errorHandler: (error: unknown) => void
}

type ConfigValueTypes = {
  [K in keyof typeof defaultConfigSymbols]: (typeof defaultConfigSymbols)[K]
}

type ValtioZodSchema<
  T extends ZodSchema,
  K extends keyof typeof defaultConfigSymbols
> = {
  [A in keyof T]: z.infer<ZodSchema>
} & {
  [P in K]?: ConfigValueTypes[P]
}

/**
 * These symbols are used to configure how the schema is parsed. They are used
 * by appending them to the schema object as a property and will be omitted from
 * the final schema object.
 */
const parseAsyncSymbol: unique symbol = Symbol('parseAsync')
const parseSafeSymbol: unique symbol = Symbol('parseSafe')
const shapeSymbol: unique symbol = Symbol('shape')
const errorHandlerSymbol: unique symbol = Symbol('errorHandler')
export {
  parseAsyncSymbol as parseAsync,
  parseSafeSymbol as parseSafe,
  errorHandlerSymbol as errorHandler
}

/**
 * These are the default values for the symbols. They can be overridden by
 * setting the symbol to a different value in the schema object.
 */
const defaultConfigSymbols: Record<symbol, any> = {
  [parseAsyncSymbol]: false,
  [shapeSymbol]: undefined,
  [errorHandlerSymbol]: (error: unknown) => console.error(error)
}

export type GlobalConfigSymbols = {
  [parseSafeSymbol]: boolean
  [errorHandlerSymbol]: (error: unknown) => void
}
/**
 * This is the global config that can be used to configure how a schema if
 * no value is provided for the schema. It a convenience for setting the
 * default values for all that can be overridden by each schema.
 */
const globalConfigSymbols: GlobalConfigSymbols = {
  [parseSafeSymbol]: false,
  [errorHandlerSymbol]: (error: unknown) => console.error(error)
}

export const globalConfig = new Proxy(globalConfigSymbols, {
  get: (target, prop: symbol) => {
    return Reflect.get(globalConfigSymbols, prop)
  },
  set: (target, prop: symbol, value: any) => {
    if (prop === parseSafeSymbol && typeof value === 'boolean') {
      globalConfig[parseSafeSymbol] = value
    } else {
      throw new Error('Only boolean values can be set for the parseSafe symbol')
    }

    if (prop === errorHandlerSymbol && typeof value === 'function') {
      globalConfig[errorHandlerSymbol] = value
    } else {
      throw new Error('Only functions can be set for the errorHandler symbol')
    }

    return true
  }
})

/**
 * This weak map is used to store the metadata for each schema. It is used to
 * determine how to parse the schema and to store the shape of the schema.
 */
const schemaMeta = new WeakMap<ZodSchema, SchemaMeta<ZodSchema>>()

/**
 * This function takes a ZodSchema and returns a proxy that can be used to
 * trap the values being set on the proxy. The proxy will automatically parse
 * the values of the schema when they are set. If the values are invalid we will
 * look at the metadata for the schema to determine how to handle the error.
 * It uses the `parseAsync` and `parseSafe` symbols to determine how to handle
 * the error.
 *
 * @param zodSchema The ZodSchema to use to parse the values of the valtio store
 * @returns A chainable function called proxy that returns a proxy that can be used to
 * trap the values being set on the proxy and validate them against the ZodSchema before
 * passing them on to the valtio store.
 */
export const schema = <T extends ZodSchema>(
  zodSchema: ValtioZodSchema<T, keyof typeof defaultConfigSymbols>
) => {
  if (!(zodSchema instanceof ZodObject)) {
    // Because valtio only supports proxies for objects, we need to throw an error
    // if the schema is not an object.
    // TODO: Add support for other types of schemas
    throw new Error('Only ZodObject schemas are supported at this time')
  }

  return {
    /**
     * This object returns a proxy function takes a ZodSchema and returns a proxy that can be used to
     * trap the values being set on the valtio proxy.
     *
     * @param zodSchema The ZodSchema to use to parse the values of the valtio store
     * @param stateObject A valtio store object
     * @returns a Proxy that can be used to trap the values being set on the proxy
     * and validate them against the ZodSchema before passing them on to the valtio store.
     */
    proxy: (stateObject: any): ValtioProxy<T> => {
      // define valtio proxy that we can use to pass values to the store
      const valtioProxy = proxy(stateObject) as ValtioProxy<T>

      // Separate the baseSchema from the metadata
      const meta = zodSchema.pick({
        [shapeSymbol]: true,
        [parseAsyncSymbol]: true,
        [parseSafeSymbol]: true,
        [errorHandlerSymbol]: true
      })
      const baseSchema = zodSchema.omit({
        [shapeSymbol]: true,
        [parseAsyncSymbol]: true,
        [parseSafeSymbol]: true,
        [errorHandlerSymbol]: true
      })

      const parseAsync =
        parseAsyncSymbol in zodSchema
          ? zodSchema[parseAsyncSymbol]
          : zodSchema instanceof ZodPromise
      const shape = zodSchema.shape

      const parseSafe =
        parseSafeSymbol in zodSchema
          ? zodSchema[parseSafeSymbol] === true
          : globalConfig[parseSafeSymbol] === true

      const errorHandler =
        errorHandlerSymbol in zodSchema
          ? zodSchema[errorHandlerSymbol]
          : globalConfig[errorHandlerSymbol]

      if (!schemaMeta.has(zodSchema)) {
        schemaMeta.set(zodSchema, {
          parseSafe,
          parseAsync,
          shape,
          errorHandler
        })
      }

      return new Proxy<ValtioProxy<T>>(valtioProxy, {
        // Use zod to check if the value is valid and if so, set the value on the valtio proxy
        set(target: z.infer<T>, prop: keyof z.infer<T>, value: any) {
          const property = zodSchema.pick({ [prop]: true as const })

          // only use try catch if the schema is not async
          if (parseAsync) {
            property
              .parseAsync({ [prop]: value })
              .then((parsedValue) => {
                ;(valtioProxy as any)[prop] = (parsedValue as any)[prop]
              })
              .catch((error) => {
                errorHandler(error)
                return false
              })
          } else {
            try {
              const parsedValue = property.parse({ [prop]: value }) as {
                [key: string]: any
              }
              valtioProxy[prop as keyof T] = parsedValue[prop as string]
            } catch (error) {
              errorHandler(error)
              return false
            }
          }

          return true
        },

        // Use valtio proxy to get the value
        get(target: ValtioProxy<T>, prop: string | symbol) {
          return valtioProxy[prop as keyof T]
        }
      })
    }
  }
}
