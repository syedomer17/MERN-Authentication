import express from 'express';
import connectDB from './config/db';

// import routes here
import userRoutes from './routes/user';

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// Middleware
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Use routes here
app.use('/api/v1', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
