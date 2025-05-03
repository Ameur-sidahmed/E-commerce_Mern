import productModel from "../models/productModel";

export const getAllProducts = async () => {
    return await productModel.find();
};

export const seedInitialProducts = async () => {
    const products = [
        {title: "iPhone 16 Pro MAX " , image: "iphone16promax.png", price: 1800 , stock: 100},
    ];

    const existingProducts = await getAllProducts();

    if(existingProducts.length === 0){
       await productModel.insertMany(products);
    }
};