const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
// const morgon = require("morgon");
// require('dotenv').config();


const app = express();




const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db')
const userModel = require("./models/models");





app.set("view engine",'ejs');
// app.use(morgon('dev'))
app.use(cookieParser())









app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))


const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return next();
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    req.user = user;
    next();
  } catch (error) {
    next();
  }
};

app.use(authMiddleware);


const homeRouter = require('./routes/home-route')
const firstRouter = require("./routes/first-router")




app.use('/home',homeRouter)
app.use('/',firstRouter)

const startServer = async () => {
  try {
    await connectDB(); // ← This should work now
    app.listen(3000, () => {
      console.log("Server is listening at port number 3000");
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};



const startServer = async () => {
  try {
    await connectDB(); // ← Connect to MongoDB first

    const PORT = process.env.PORT || 3000; // Use Render's port OR fallback to 3000 locally
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();







