import { z } from 'zod';
import { schema } from '../src/index.js';

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

const user = schema(userSchema).proxy({
  username: 'Alice',
  age: 30,
  profile: {
    firstName: 'Alice',
    lastName: 'Smith',
    address: {
      city: 'Wonderland',
    },
  },
});

try {
  user.username = 'Bob';
} catch (e) {
  console.error(e);
}
