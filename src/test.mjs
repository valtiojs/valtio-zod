/* global console */
import { z } from 'zod'
import { schema } from '../dist/index.js'
import util from 'node:util'

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
      city: z.string(),
      country: z.string(),
      foo: z.object({
        bar: z.string(),
        bat: z.string()
      })
    })
  })
})

const state = {
  username: 'Alice',
  age: 30,
  profile: {
    firstName: 'Alice',
    lastName: 'Smith',
    address: {
      city: 'asdf',
      country: 'Fantasy',
      foo: {
        bar: 'asd',
        bat: 'asdf'
      }
    }
  }
}

const errorHandler = (e) => {
  console.log('There was an error')
}

const userState = schema(userSchema).proxy(state, {
  errorHandler,
  safeParse: true
})
console.log(util.types.isProxy(userState.profile.address))

const result = (userState.profile.address.city = 123)
console.log(result)

console.log(util.types.isProxy(userState.profile.address.foo))
