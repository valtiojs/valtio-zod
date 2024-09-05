import './App.css';
import { z } from 'zod';
import { schema, useSnapshot } from '../../../src/index';

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

const userState = schema(userSchema).proxy(
  {
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
  },
  { safeParse: true, errorHandler: (e) => console.log(e.message) },
);

function App() {
  const user = useSnapshot(userState);

  return (
    <div>
      <h1>Vite + React</h1>

      <label htmlFor="username">Username</label>
      <input
        id="username"
        type="text"
        value={user.username}
        onChange={(e) => (userState.username = e.target.value)}
      />
      <p>Username: {user.username}</p>

      <label htmlFor="age">Age</label>
      <input
        id="age"
        type="text"
        value={'' + user.age}
        onChange={(e) => (userState.age = Number(e.target.value))}
      />
      <p>Age: {user.age}</p>

      <label htmlFor="lastName">First Name</label>
      <input
        id="firstName"
        type="text"
        value={user.profile.firstName}
        onChange={(e) => (userState.profile.firstName = e.target.value)}
      />
      <p>First Name: {user.profile.firstName}</p>

      <label htmlFor="lastName">Last Name</label>
      <input
        id="lastName"
        type="text"
        value={user.profile.lastName}
        onChange={(e) => (userState.profile.lastName = e.target.value)}
      />
      <p>Last Name: {user.profile.lastName}</p>

      <label htmlFor="lastName">Last Name</label>
      <input
        id="city"
        type="text"
        value={user.profile.address.city}
        onChange={(e) => (userState.profile.address.city = e.target.value)}
      />
      <p>City: {user.profile.address.city}</p>

      <label htmlFor="country">Last Name</label>
      <input
        id="country"
        type="text"
        value={user.profile.address.country}
        onChange={(e) => (userState.profile.address.country = e.target.value)}
      />
      <p>Last Name: {user.profile.address.country}</p>
    </div>
  );
}

export default App;
