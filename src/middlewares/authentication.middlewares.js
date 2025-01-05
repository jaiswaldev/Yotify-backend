import { asynchandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import cookieParser from "cookie-parser";


export const verifyJWT = asynchandler(async(req,res,next)=>{
   try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    if(!token){
      throw new ApiError(401,"UnAuthorized Request!!")
    }
    
    const decodedinfo = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    // console.log(decodedinfo)
    const user = await User.findById(decodedinfo?._id).select(
     "-password -refreshToken"
    )
 
    if(!user){
     throw new ApiError(401,"Invalid AccessToken!!")
    }
 
    req.user = user;
    next()
   }catch(error) {
       throw new ApiError(401,error?.message || "Invalid AccessToken!!" )
   }
})