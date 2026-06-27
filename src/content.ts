// Sample code snippets for component previews

export const sampleTypeScript = `function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(\`The 10th Fibonacci number is: \${result}\`);`;

export const sampleHighlightedTypeScript = `interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  const user = await response.json();
  return user;
}

async function updateUserEmail(id: number, email: string) {
  const user = await fetchUser(id);
  user.email = email;

  await fetch(\`/api/users/\${id}\`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });

  return user;
}`;

// Sample diagrams for Diagram component previews
export const sampleMermaidDiagram = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[Deploy]
    E --> F[End]`;

export const sampleD2Diagram = `direction: right

users: Users {
  shape: person
  style.multiple: true
}

lb: Load Balancer {
  shape: hexagon
}

api: API Server {
  shape: rectangle
}

db: Database {
  shape: cylinder
}

cache: Redis Cache {
  shape: stored_data
}

users -> lb: HTTPS
lb -> api: HTTP
api -> db: Query
api -> cache: Read/Write
cache -> db: Cache miss`;
