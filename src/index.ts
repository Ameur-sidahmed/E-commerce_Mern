import express from "express";
import mongoose from "mongoose";
import userRoute from "./routes/userRoute";
import { seedInitialProducts } from "./services/productService";
import productRoutes from "./routes/productRoute";
import cartRoutes from "./routes/cartRoute";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3001;

app.use(express.json());

mongoose
    .connect(process.env.MONGO_URI || '')
    .then(()=> console.log("Mongo connected!"))
    .catch((err) => console.log("failed to connect!", err));
    
    // Seed the products to database
    seedInitialProducts();
    
    app.use("/user",userRoute);
    app.use("/products", productRoutes);
    app.use("/cart", cartRoutes);


    app.listen(port, () => {
        console.log(`Server is running at: http://localhost:${port}`)
    })