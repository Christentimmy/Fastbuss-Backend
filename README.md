# FastBuss Backend

A bus booking system backend for European routes built with Node.js, TypeScript, and Express.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Project Structure

```
src/
  ├── index.ts          # Application entry point
  ├── routes/           # API routes
  ├── controllers/      # Route controllers
  ├── models/          # Data models
  ├── services/        # Business logic
  ├── middleware/      # Custom middleware
  └── utils/           # Utility functions
```

## Testing

Run tests using:
```bash
npm test
```

## License

[MIT](LICENSE) 