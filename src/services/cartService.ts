import cartModel, { ICart, ICartItem } from "../models/cartModel";
import orderModel, { IOrderItem } from "../models/orderModel";
import productModel from "../models/productModel";

interface CreateCartForUser {
    userId: string;
}

const CreateCartForUser = async ({ userId }: CreateCartForUser) => {
    const cart = await cartModel.create({  userId , totalAmount: 0});
    await cart.save();
    return cart;
};

interface GetActiveCartForUser {
    userId: string;
}

export const getActiveCartForUser = async ({ userId }: GetActiveCartForUser) => {
    let cart = await cartModel.findOne({ userId, status: "active" });
    
    if(!cart) {
        return await CreateCartForUser({ userId });
    }

    return cart;
};

interface clearCart {
    userId: string
}

export const clearCart = async ({ userId }: clearCart) => {
    const cart = await getActiveCartForUser({ userId });
    cart.items = [];
    cart.totalAmount = 0;
    const updatedCart = await cart.save();
    return { data: updatedCart, statusCode: 200 };
}

interface addItemToCart {
    userId: string;
    productId: any;
    quantity: number;
}

export const addItemToCart = async ({ userId, productId, quantity }: addItemToCart) => {
    const cart = await getActiveCartForUser({ userId });

    // Does the item exist in the cart ? 
    const existsInCart = cart.items.find((p) => p.product.toString() === productId);

    if(existsInCart) {
         return { data: "Item already exists in cart", statusCode: 400 };
    }

    //Fetch the product
    const product = await productModel.findById(productId);

    if(!product) {
        return { data: "Product not found", statusCode: 400 };
    }

    if(product.stock < quantity) {
        return { data: "Low stock for item", statusCode: 400 };
    }

    cart.items.push({ 
        product: productId, 
        unitPrice: product.price, 
        quantity
    });
    
    //Update the totaleAmount for the cart 
    cart.totalAmount += product.price * quantity;


    const updatedCart = await cart.save();
    return { data: updatedCart, statusCode: 201 };
}

interface updateItemInCart {
    userId: string;
    productId: any;
    quantity: number;
}

export const updateItemInCart = async ({ userId, productId, quantity }: updateItemInCart) => {
    const cart = await getActiveCartForUser({ userId });

    // Does the item exist in the cart ? 
    const existsInCart = cart.items.find((p) => p.product.toString() === productId);

    if(!existsInCart) {
         return { data: "Item does not exist in cart", statusCode: 400 };
    }

    const product = await productModel.findById(productId);

    if(!product) {
            return { data: "Product not found", statusCode: 400 };
    }

    if(product.stock < quantity) {
        return { data: "Low stock for item", statusCode: 400 };
    }


    const otherCartItems = cart.items.filter((p) => p.product.toString() !== productId);
 

    let total = calculateCartTotalItem({cartItems: otherCartItems});

    
    existsInCart.quantity = quantity;

    total += existsInCart.quantity * existsInCart.unitPrice;

    cart.totalAmount = total;
    const updatedCart = await cart.save();
    return { data: updatedCart, statusCode: 200 };
    
}

interface deleteItemInCart {
    userId: string;
    productId: any;
    quantity: number;
}


export const deleteItemInCart = async ({ userId, productId }: deleteItemInCart) => {
    const cart = await getActiveCartForUser({ userId });

    // Does the item exist in the cart ? 
    const existsInCart = cart.items.find((p) => p.product.toString() === productId);

    if(!existsInCart) {
         return { data: "Item does not exist in cart", statusCode: 400 };
    }

    const otherCartItems = cart.items.filter((p) => p.product.toString() !== productId);
 

    let total = calculateCartTotalItem({cartItems: otherCartItems});
    
    cart.items = otherCartItems;

    cart.totalAmount = total;
    const updatedCart = await cart.save();
    return { data: updatedCart, statusCode: 200 };
    
}

const calculateCartTotalItem = ({cartItems,} : {cartItems: ICartItem[];}) => {
 
    let total = cartItems.reduce((sum, product) => {
        sum += product.quantity * product.unitPrice;
        return sum;
    },0)

    return total;
}

interface checkout {
    userId: string;
    address: string;
}

export const checkout = async ({ userId , address }: checkout ) => {

    if(!address){
        return { data: "Please add the address" , statusCode:400}
    }

    const cart = await getActiveCartForUser({ userId });

    const orderItems: IOrderItem[] = [];
    
    for(const item of cart.items){
        const product = await productModel.findById(item.product);
        
        if(!product) {
            return { data: "Product not found", statusCode: 400 };
        }

        const orderItem: IOrderItem = {
            productTitle: product.title,
            productImage: product.image,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
        }

        orderItems.push(orderItem);
    }

    const order = await orderModel.create({
            orderItems,
            total: cart.totalAmount,
            address,
            userId,
        });
        
         await order.save();

         //Update the cart status to be completed

         cart.status = "completed";
         await cart.save();

        return {data: order, statusCode: 200};

}