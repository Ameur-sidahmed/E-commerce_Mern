import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel";


import { extendRequest } from "../types/extendedRequest";

const validateJWT = (req: extendRequest, res: Response, next: NextFunction) => {
    const authorizationHeader = req.get("authorization");
    if(!authorizationHeader) {
         res.status(403).send({ message: "Authorization header was not provided" });
         return
    }

    const token = authorizationHeader.split(" ")[1];
    if(!token) {
         res.status(403).send({ message: "Bearer Token not found" });
         return;
    }

    jwt.verify(token, "L?XGhO>p}.h0b`/eG.Eo8acms<#Den", async (err, payload) => {
        if(err) {
             res.status(401).send({ message: "Invalid Token" });
             return
        }


        if(!payload) {
            res.status(401).send({ message: "Invalid Token payload" });
            return;
        }

        const userPayload = payload as {
            email: string;
            firstName: string;
            lastName: string;
        }
       
        //fetch user from database based on the payload
        const user = await userModel.findOne({ email: userPayload.email });
        req.user = user;
        next();
    });
};

export default validateJWT;






