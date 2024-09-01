import './App.css';
import { z } from 'zod';
import { schema, useSnapshot } from '../../../dist/index.js';

const userSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  age: z.number(),
});

const userState = schema(userSchema).proxy({
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
});

function App() {
  const user = useSnapshot(userState);

  return (
    <div>
      <h1>Vite + React</h1>
      <label htmlFor="firstName">First Name</label>
      <input
        id="firstName"
        type="text"
        value={user.firstName}
        onChange={(e) => (userState.firstName = e.target.value)}
      />
      <p>First Name: {user.firstName}</p>
      <label htmlFor="lastName">Last Name</label>
      <input
        id="lastName"
        type="text"
        value={user.lastName}
        onChange={(e) => (userState.lastName = e.target.value)}
      />
      <p>Last Name: {user.lastName}</p>
      <label htmlFor="age">Age</label>
      <input
        id="age"
        type="number"
        value={user.age}
        onChange={(e) => (userState.age = Number(e.target.value))}
      />
      <p>Age: {user.age}</p>
    </div>
  );
}

export default App;
