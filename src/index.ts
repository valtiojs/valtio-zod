/* eslint-disable */
import { z, ZodSchema, ZodType, ZodPromise, ZodObject } from 'zod'
import { proxy } from 'valtio'
import { parse } from 'path'

type ValtioProxy<T> = {
  [P in keyof T]: T[P]
}

type SchemaMeta<T extends ZodSchema> = {
  parseAsync: boolean
  shape: z.infer<T>
  parseSafe: boolean
  errorHandler: (error: unknown) => void
}

type SchemaConfig = {
  parseAsync?: boolean
  parseSafe?: boolean
  errorHandler?: (error: unknown) => void
}

const defaultConfig = {
  parseAsync: false,
  parseSafe: false,
  errorHandler: (error: unknown) => console.error(error)
}

export const vzGlobalConfig = {
  parseSafe: false,
  errorHandler: (error: unknown) => console.error(error)
}

const schemaMeta = new WeakMap<ZodSchema, SchemaMeta<ZodSchema>>()

type SchemaReturn<T extends ZodSchema> = {
  proxy: (stateObject: any, config?: SchemaConfig) => ValtioProxy<z.infer<T>>
}

export const schema = <T extends ZodObject<any>>(
  zodSchema: T
): SchemaReturn<T> => {
  return {
    proxy: (
      stateObject: z.infer<T>,
      config: SchemaConfig = {}
    ): ValtioProxy<z.infer<T>> => {
      const valtioProxy = proxy(stateObject)

      const parseAsync = config.parseAsync ?? zodSchema instanceof ZodPromise
      const parseSafe = config.parseSafe ?? vzGlobalConfig.parseSafe
      const errorHandler = config.errorHandler ?? vzGlobalConfig.errorHandler

      if (!schemaMeta.has(zodSchema)) {
        schemaMeta.set(zodSchema, {
          parseSafe,
          parseAsync,
          shape: zodSchema.shape,
          errorHandler
        })
      }

      return new Proxy(valtioProxy, {
        set(target, prop, value, receiver) {
          const propertySchema = zodSchema.shape[prop as keyof z.infer<T>]

          const handleAsyncParse = async () => {
            try {
              const parsedValue = await propertySchema.parseAsync(value)
              Reflect.set(target, prop, parsedValue, receiver)
              return true
            } catch (error) {
              errorHandler(error)
              return false
            }
          }

          if (parseAsync && propertySchema.parseAsync) {
            handleAsyncParse().catch((error) => {
              errorHandler(error)
            })
            return true
          } else {
            try {
              const parsedValue = propertySchema.parse(value)
              if (parseSafe) {
                const result = propertySchema.safeParse(value)
                if (result.success) {
                  Reflect.set(target, prop, result.data, receiver)
                } else {
                  errorHandler(result.error)
                  return false
                }
              } else {
                Reflect.set(target, prop, parsedValue, receiver)
              }
              return true
            } catch (error) {
              errorHandler(error)
              return false
            }
          }
        }
      })
    }
  }
}
