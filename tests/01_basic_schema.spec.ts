import { z } from 'zod'
import { describe, it, expect, vi } from 'vitest'
import { schema } from 'valtio-zod'

describe('valtio-zod schema', () => {
  it('should create a proxy and set synchronous values correctly', () => {
    const userSchema = z.object({
      username: z.string(),
      age: z.number().int()
    })

    const { proxy } = schema(userSchema)
    const user = proxy({ username: 'Alice', age: 30 })

    user.username = 'Bob'
    expect(user.username).toBe('Bob')

    user.age = 42
    expect(user.age).toBe(42)
  })

  it('should handle parseSafe correctly', () => {
    const userSchema = z.object({
      username: z.string(),
      age: z.number().int()
    })

    const { proxy } = schema(userSchema)
    const user = proxy({ username: 'Alice', age: 30 }, { safeParse: true })

    const errorHandler = vi.fn()

    user.age = 'invalidAge' as any

    expect(errorHandler).toHaveBeenCalled()
    expect(user.age).toBe(30) // Ensure the value hasn't changed
  })

  it('should handle parseAsync correctly', async () => {
    const userSchema = z.object({
      username: z.string(),
      age: z.number().int()
    })

    const { proxy } = schema(userSchema)
    const user = proxy({ username: 'Alice', age: 30 }, { parseAsync: true })

    user.username = await Promise.resolve('Bob')
    // Ensure that the proxy update handling completes
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(user.username).toBe('Bob')
  })

  it('should use custom error handler', () => {
    const userSchema = z.object({
      username: z.string(),
      age: z.number().int()
    })

    const errorHandler = vi.fn()

    const { proxy } = schema(userSchema)
    const user = proxy({ username: 'Alice', age: 30 }, { errorHandler })

    try {
      // Invalid age
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user.age = 'invalidAge' as any
    } catch (_e) {
      // Since parseSafe is false, the error should be caught here
    }

    expect(errorHandler).toHaveBeenCalled()
  })

  it('should handle multi-level objects correctly', async () => {
    const userSchema = z.object({
      username: z.string(),
      age: z.number().int(),
      profile: z.object({
        firstName: z.string(),
        lastName: z.string(),
        address: z.object({
          city: z.string(),
          country: z.string()
        })
      })
    })

    const { proxy } = schema(userSchema)
    const user = proxy(
      {
        username: 'Alice',
        age: 30,
        profile: {
          firstName: 'Alice',
          lastName: 'Smith',
          address: {
            city: 'Wonderland',
            country: 'Fantasy'
          }
        }
      },
      { parseAsync: true }
    )

    // Ensure nested fields maintain object structure and types
    user.profile.address.city = await Promise.resolve('New City')
    await new Promise((resolve) => setTimeout(resolve, 0)) // Ensure the proxy update handling completes
    expect(user.profile.address.city).toBe('New City')

    // Validate entire nested object
    const updatedProfile = {
      firstName: 'Alice',
      lastName: 'Smith',
      address: {
        city: 'Dreamland',
        country: 'Imagination'
      }
    }
    user.profile = await Promise.resolve(updatedProfile)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(user.profile).toEqual(updatedProfile)
  })

  it('should error by updating a value in a nested object', () => {
    const userSchema = z.object({
      username: z.string(),
      age: z.number().int(),
      profile: z.object({
        firstName: z.string(),
        lastName: z.string(),
        address: z.object({
          city: z.string(),
          country: z.string()
        })
      })
    })

    const errorHandler = vi.fn()

    const { proxy } = schema(userSchema)
    const user = proxy(
      {
        username: 'Alice',
        age: 30,
        profile: {
          firstName: 'Alice',
          lastName: 'Smith',
          address: {
            city: 'Wonderland',
            country: 'Fantasy'
          }
        }
      },
      { errorHandler, safeParse: true }
    )

    console.log('Before invalid assignment')
    try {
      // Invalid city type
      // @ts-expect-error for test use case
      user.profile.address.city = 123
    } catch (e) {
      console.error('Caught error:', e)
    }
    console.log('After invalid assignment')

    expect(errorHandler).toHaveBeenCalled()
    // Ensure the value hasn't changed from the initial valid value
    expect(user.profile.address.city).toBe('Wonderland')
  })
})
