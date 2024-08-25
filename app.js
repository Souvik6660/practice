import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import morgan from 'morgan';
import cloudinary from 'cloudinary';
import Razorpay from 'razorpay';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import miscRoutes from './routes/miscRoutes.js';

// Load environment variables
config();

const app = express();

// Cloudinary Configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Razorpay configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// CORS Configuration
app.use(cors({
  origin: [process.env.FRONTEND_URL], // Allow requests from this origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Specify allowed methods
  credentials: true // Allow cookies and other credentials to be sent
}));

// Handle preflight requests
app.options('*', cors());

// Health check route
app.use('/ping', (req, res) => {
  res.send('YES I AM RUNNING');
});

// API Routes
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1', miscRoutes);

// 404 handler
app.all('*', (req, res) => {
  res.status(404).send('Oops! 404 page not found');
});

export { app, razorpay };
