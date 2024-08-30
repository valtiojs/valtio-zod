import { z } from 'zod'
import { schema } from './index.js'
/**
 * Module {
  affectedToPathList: [Function: affectedToPathList],
  createProxy: [Function: createProxy],
  getUntracked: [Function: getUntracked],
  isChanged: [Function: isChanged],
  markToTrack: [Function: markToTrack],
  replaceNewProxy: [Function: replaceNewProxy],
  trackMemo: [Function: trackMemo],
}
 */

const userSchema = z.object({
  username: z.string(),
  age: z.number().int(),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    address: z.object({
      foo: z.object({
        bar: z.string(),
        bat: z.string()
      })
    })
  })
})

const errorHandler = (e) => {
  console.log('There was an error')
}

const initialState = {
  username: 'Alice',
  age: 30,
  profile: {
    firstName: 'Alice',
    lastName: 'Smith',
    address: {
      foo: {
        bar: 'baz',
        bat: 123
      }
    }
  }
}
try {
  userSchema.parse(initialState)
} catch (e) {
  console.log(e)
}

const userState = schema(userSchema).proxy(initialState, {
  errorHandler
})

try {
  // @ts-expect-error for test use case
  userState.profile.firstName = 123 // throws error and doesn't update
} catch (e) {
  console.log(e)
}

console.log(userState.profile.firstName)
// try {
//   // @ts-expect-error for test use case
//   userState.profile.address.country = 123 // doesn't throw error and updates
// } catch (e) {
//   console.log(e)
// }
try {
  // @ts-expect-error for test use case
  userState.profile.address.foo.bar = 123
} catch (e) {
  console.log(e)
}
console.log(userState.profile.address.foo.bar)

try {
  // @ts-expect-error for test use case
  userState.profile.address.foo.bat = 123
} catch (e) {
  console.log(e)
}

console.log(userState.profile.address.foo.bar)
