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
      city: z.string(),
      country: z.string()
    })
  })
})

const initialState = {
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
}

const userState = schema(userSchema).proxy(initialState)

userState.profile.address.city = 'New City'

console.log(userState.profile.address.city)
