/* eslint-disable */
import { z, ZodType } from 'zod';
import { proxy as vproxy, useSnapshot as vsnap } from 'valtio';
import _ from 'lodash';

type ValtioProxy<T> = {
  [P in keyof T]: T[P];
};

type SchemaConfig = {
  parseAsync?: boolean;
  safeParse?: boolean;
  errorHandler?: (error: unknown) => void;
};

const defaultConfig = {
  parseAsync: false,
  safeParse: false,
  errorHandler: (error: unknown) => console.error(error),
};

export const vzGlobalConfig = {
  safeParse: false,
  errorHandler: (error: unknown) => console.error(error),
};

const isObject = (x: unknown): x is object =>
  typeof x === 'object' && x !== null;

type MergedConfig = Required<SchemaConfig>;

type SchemaMeta = SchemaConfig & {
  initialState: unknown;
};

type PropType = string | number | symbol;
const schemaMeta = new WeakMap<ZodType<any>, SchemaMeta>();
const pathList = new WeakMap<{}, PropType[]>();

type SchemaReturn<T extends ZodType<any>> = {
  proxy: {
    (initialState: any, config?: SchemaConfig): ValtioProxy<z.infer<T>>;
  };
};

function updateObjectAtPath(obj: any, path: PropType[], newValue: any) {
  let stack = [...path];
  let object = obj;

  while (stack.length > 1) {
    const key = stack.shift();
    if (key === undefined) return;
    if (!object[key] || typeof object[key] !== 'object') {
      object[key] = {};
    }
    object = object[key];
  }

  const lastKey = stack.shift();
  if (lastKey !== undefined) object[lastKey] = newValue;
}

const valtioStoreSymbol = Symbol('valtioStore');

export const useSnapshot = (store: any) => {
  return vsnap(store[valtioStoreSymbol]);
};

export const schema = <T extends ZodType<any>>(
  zodSchema: T,
): SchemaReturn<T> => {
  let valtioProxy: any;
  const proxy = (
    initialState: z.infer<T>,
    config: SchemaConfig = {},
  ): ValtioProxy<z.infer<T>> => {
    if (!isObject(initialState)) {
      throw new Error('object required');
    }

    const mergedConfig: MergedConfig = { ...defaultConfig, ...config };

    const parseAsync = mergedConfig.parseAsync;
    const safeParse = mergedConfig.safeParse;
    const errorHandler = mergedConfig.errorHandler;

    // before proxying, validate the initial state
    if (parseAsync) {
      zodSchema.parseAsync(initialState).catch((e) => {
        throw e;
      });
    } else {
      zodSchema.parse(initialState);
    }

    valtioProxy = vproxy(initialState);

    const createProxy = (target: any, parentPath: PropType[] = []): any => {
      if (!schemaMeta.has(zodSchema)) {
        schemaMeta.set(zodSchema, {
          safeParse,
          parseAsync,
          errorHandler,
          initialState,
        });
      }

      return new Proxy(target, {
        get(target, prop, receiver) {
          const value = Reflect.get(target, prop, receiver);
          if (isObject(value)) {
            const newPath = parentPath.concat(prop);
            pathList.set(value, newPath);
            return createProxy(value, newPath);
          } else {
            return value;
          }
        },
        set(target, prop, value, receiver) {
          const originalObject = schemaMeta.get(zodSchema)!
            .initialState as z.infer<T>;

          const objectToValidate = JSON.parse(JSON.stringify(originalObject));
          const path = (pathList.get(target) || []).concat(prop);

          updateObjectAtPath(objectToValidate, path, value);

          const handleAsyncParse = async () => {
            try {
              const parsedValue = await zodSchema.parseAsync(objectToValidate);
              _.set(valtioProxy, value, path);
              Reflect.set(target, prop, value, receiver);
              return true;
            } catch (error) {
              errorHandler(error);
              if (!safeParse) {
                throw error;
              }
              return false;
            }
          };

          const handleSyncParse = () => {
            try {
              if (safeParse) {
                const result = zodSchema.safeParse(objectToValidate);
                if (result.success) {
                  valtioProxy[prop] = value;
                  Reflect.set(target, prop, value, receiver);
                  return true;
                } else {
                  errorHandler(result.error);
                  return false;
                }
              } else {
                const parsedValue = zodSchema.parse(objectToValidate);
                Reflect.set(target, prop, value, receiver);
                valtioProxy[prop] = value;
                return true;
              }
            } catch (error) {
              errorHandler(error);
              if (!safeParse) {
                throw error;
              }
              return false;
            }
          };

          if (parseAsync) {
            handleAsyncParse().catch((error) => {
              errorHandler(error);
              if (!safeParse) {
                throw error;
              }
            });
            return true;
          } else {
            return handleSyncParse();
          }
        },
      });
    };

    const store = createProxy(valtioProxy);
    store[valtioStoreSymbol] = valtioProxy;

    return store;
  };
  return { proxy };
};
