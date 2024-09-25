import { z } from 'zod';
import { describe, it, expect, vi } from 'vitest';
import { schema } from 'valtio-zod';

describe('valtio-zod schema', () => {
  it('should create a proxy and set synchronous values correctly', () => {
    const userSchema = z.object({
      username: z.string(),
      age: z.number().int(),
    });

    const { proxy } = schema(userSchema);
    const user = proxy({ username: 'Alice', age: 30 });

    expect(proxy).toThrowError();

    user.username = 'Bob';
    expect(user.username).toBe('Bob');

    user.age = 42;
    expect(user.age).toBe(42);
  });

  it('should handle parseSafe correctly', () => {
    const userSchema = z.object({
      username: z.string(),
      age: z.number().int(),
    });

    const { proxy } = schema(userSchema);
    const user = proxy(
      { username: 'Alice', age: 30 },
      { safeParse: true, errorHandler: vi.fn() },
    );

    const errorHandler = vi.fn();

    // @ts-expect-error Invalid age for testing
    user.age = 'invalidAge';

    setTimeout(() => {
      expect(errorHandler).toHaveBeenCalled();
      expect(user.age).toBe(30); // Ensure the value hasn't changed
    }, 100);
  });

  it('should use custom error handler', () => {
    const userSchema = z.object({
      username: z.string(),
      age: z.number().int(),
    });

    const errorHandler = vi.fn();

    const { proxy } = schema(userSchema);
    const user = proxy({ username: 'Alice', age: 30 }, { errorHandler });

    try {
      // Invalid age
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user.age = 'invalidAge' as any;
    } catch (_e) {
      // Since parseSafe is false, the error should be caught here
    }

    expect(errorHandler).toHaveBeenCalled();
  });

  it('should handle multi-level objects correctly', async () => {
    const userSchema = z.object({
      username: z.string(),
      age: z.number().int(),
      profile: z.object({
        firstName: z.string(),
        lastName: z.string(),
        address: z.object({
          city: z.string(),
          country: z.string(),
        }),
      }),
    });

    const { proxy } = schema(userSchema);
    const user = proxy({
      username: 'Alice',
      age: 30,
      profile: {
        firstName: 'Alice',
        lastName: 'Smith',
        address: {
          city: 'Wonderland',
          country: 'Fantasy',
        },
      },
    });

    // Ensure nested fields maintain object structure and types
    user.profile.address.city = 'New City'; // Ensure the proxy update handling completes
    expect(user.profile.address.city).toBe('New City');
  });

  // it('should error by updating a value in a nested object', () => {
  //   const userSchema = z.object({
  //     username: z.string(),
  //     age: z.number().int(),
  //     profile: z.object({
  //       firstName: z.string(),
  //       lastName: z.string(),
  //       address: z.object({
  //         city: z.string(),
  //         country: z.string()
  //       })
  //     })
  //   })

  //   const { proxy } = schema(userSchema)
  //   const user = proxy(
  //     {
  //       username: 'Alice',
  //       age: 30,
  //       profile: {
  //         firstName: 'Alice',
  //         lastName: 'Smith',
  //         address: {
  //           city: 'Wonderland',
  //           country: 'Fantasy'
  //         }
  //       }
  //     },
  //     { safeParse: true }
  //   )

  //   // @ts-expect-error Invalid country type
  //   user.profile.address.country = 123)

  //   setTimeout(() => {
  //     // Ensure the value hasn't changed from the initial valid value
  //     expect(user.profile.address.country).toBe('Fantasy')
  //   }, 0)
  // })
});
