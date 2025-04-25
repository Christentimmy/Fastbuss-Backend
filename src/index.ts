import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectToDatabase } from "./config/database";
import authRoutes from "./routes/auth_routes";


dotenv.config();

const app = express();
const port = process.env.PORT || 5000;


app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectToDatabase();

app.use('/api/v1/auth', authRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to FastBuss API' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 