import { asynchandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import { isValidEmail, validatePassword } from "../utils/validations.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefereshTokens = async(userId)=>{
   try{
      // console.log(userId)
      const user = await User.findById(userId)
      // console.log(user)
      const AccessToken = await user.generateAccessToken()
      // console.log(AccessToken)
      const RefreshToken = await user.generateRefreshToken()
      // console.log(RefreshToken)
      user.refreshToken = RefreshToken;
      // console.log(user)
      await user.save({validateBeforeSave: false})
   
     

      return {AccessToken,RefreshToken}

   }catch(error){
      throw new ApiError(500,"semething went wrong,while generating Tokens!!please try Again Later.")
   }
}

const Registeruser = asynchandler(async (req,res)=>{
   //get user details from request(frontend).
   //Vadilation - all fields those are required are present or not.
   //check user already exist or not.
   //upload all images/files on cloudinary.
   //           (not done yet waiting for testing)check these are uploaded or not.. correctly on cloudinary.
   //create a user object and add it to DB.
   //remove password and refreshtokens from object.
   //check user is created or not.
   //return response.


   //step1. receive Data from frontend.
   
   // console.log(req.body);
   // console.log(req.files);
   let {username,avatar,coverImage}= req.body
   const {fullname,email,password} = req.body
   // console.log("username:",username);
    
   //also get file by using multer. in user routes,
   //we have to inject middleware called multer for saving files to our local.
    

   //step2. Validations.
   if(username === "") {
      throw new ApiError(400,"UserName is Required!")
   }
   if(fullname === "") {
      throw new ApiError(400,"FullName is Required!")
   }
   if(email === "") {
      throw new ApiError(400,"Email is Required!")
   }
   if(!isValidEmail(email)){
      throw new ApiError(400,"Please Enter Valid Email!")
   }
   validatePassword(password)
   

   username = username.toLowerCase()
   //step3. check user is already exist or not.
   const usernameExisted = await User.findOne({username})
   // console.log(usernameExisted);
   
   if(usernameExisted){
      throw new ApiError(409, "UserName Already Exist, try Unique UserName!!")
   }
   const Emailexisted = await User.findOne({email})
   // console.log(Emailexisted);
   if(Emailexisted){
      throw new ApiError(409, "Email Already Exist,Please Try Different Email!!")
   }

   //step4. upload files on cloudinary.
   let avatarLocalPath;
   if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length>0){
      avatarLocalPath = req.files.avatar[0].path
   }
   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
      coverImageLocalPath = req.files.coverImage[0].path
   }

   // const avatarLocalPath = req.files?.avatar[0]?.path
   // const coverImageLocalPath = req.files?.coverImage[0]?.path

   if(avatarLocalPath){
      avatar = await uploadOnCloudinary(avatarLocalPath)
   }
   if(coverImageLocalPath){
      coverImage = await uploadOnCloudinary(coverImageLocalPath)
   }
   // console.log(avatar)
   //step5. create user object and add it in DataBase.
   const user = await User.create({
      username: username.toLowerCase(),
      email,
      fullname,
      password,
      avatar: avatar?.url || "",
      coverImage: coverImage?.url || ""
   })
  

   //step6. remove password and refresh tokens from object.
   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )
   
   //step7. check user is created or not.
   if(!createdUser){
      throw new ApiError(500,"Something Went Wrong While Registering the User,Please Try Again Later!!")
   }




   //step8. Return Response/user successfully created.
   return res.status(201).json(
      new ApiResponse(200,createdUser,"User Registered Successfully!!")
   )


   
})

const loginUser = asynchandler(async (req,res)=>{
   // get data from frontend.
   // check data with our database.
   // if data base present in our database then,
   //check password is correct or not 
   // if correct then generate accesstoken and refreshtoken and send it to our data base.
   //send cookies to user
   //send response.

   //step1.
   // console.log(req.body)
   let {username} = req.body
   const {email,password} = req.body
   if(email === "") {
      throw new ApiError(400,"Email is Required!")
   }

   // console.log(email)

   if(!isValidEmail(email)){
      throw new ApiError(400,"Please Enter Valid Email!")
   }

   //step2.
   const existed = await User.findOne({
      $or: [{email},{username}]
   })
   // console.log(existed)
   if(!existed){
      throw new ApiError(404,"User does not Exist!!")
   }

   //step3.
   const ispasswordValid= await existed.isPasswordCorrect(password)
   if(!ispasswordValid){
      throw new ApiError(401,"Incorrect password!!")
   }


   // console.log(existed._id)
   //step4.
   const{AccessToken,RefreshToken}=await generateAccessAndRefereshTokens(existed._id)


   //response.
   const loggedInUser = await User.findById(existed._id).select(
      "-password -refreshToken"
   )

   //step5.
   const options= {
      httpOnly:true,
      secure:true
   }

   return res.status(200).cookie("accessToken",AccessToken,options)
   .cookie("refreshToken",RefreshToken,options).json(
      new ApiResponse(200,{
         user: loggedInUser,
         AccessToken,
         RefreshToken
      },
   "User Logged In Successfully!!")
   )
})

const loggedOutUser = asynchandler(async (req,res)=>{
   //delete refereshtoken from database.
   //delete cookies from user.
   // console.log(req.user)
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set : {
            refreshToken: undefined
         }
      },
      {
         new: true
      }
   )
   
   const options= {
      httpOnly:true,
      secure:true
   }

   return res.status(200).clearCookie("accessToken",options)
   .clearCookie("RefreshToken",options)
   .json(new ApiResponse(200,{},"Successfully LoggedOut!!"))
})

const refreshAccessToken = asynchandler(async(req,res)=>{
   const refToken = req.cookies.refreshToken || req.body.refreshToken
   if(!refToken){
      throw new ApiError(401,"UnAuthorized Request!!")
   }
   try {
      const decodedToken = jwt.verify(refToken,process.env.REFRESH_TOKEN_SECRET)
      const user = await User.findById(decodedToken?._id)
      if(!user){
         throw new ApiError(401,"Invalid RefreshToken!!")
      }
   
      if(refToken !== user?.refreshToken){
         throw new ApiError(401,"Refresh Token is Expired!!")
      }
   
      const{AccessToken,RefreshToken}=await generateAccessAndRefereshTokens(user._id)
   
      const options= {
         httpOnly:true,
         secure:true
      }
   
      return res.status(200).cookie("accesstoken",AccessToken,options)
      .cookie("refreshtoken",RefreshToken,options).json(
         new ApiResponse(200,{
            AccessToken,
            RefreshToken
         },"AccessToken Refreshed")
      )
   } catch (error) {
      throw new ApiError(401,error?.message || "Invalid RefreshToken!!")
   }
})

const  changeUserDetails = asynchandler(async(req,res)=>{
   //get data from frontend.
   //check user is logged in or not.
   //update user details.
   //send response.
   // console.log(req.body)
   let {avatar,coverImage} = req.body
   const {username,fullname} = req.body 
   // console.log(req.user)
   let avatarLocalPath;
   if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length>0){
      avatarLocalPath = req.files.avatar[0].path
   }
   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
      coverImageLocalPath = req.files.coverImage[0].path
   }

   if(avatarLocalPath){
      avatar = await uploadOnCloudinary(avatarLocalPath)
   }
   if(coverImageLocalPath){
      coverImage = await uploadOnCloudinary(coverImageLocalPath)
   }
   const Updateduser = await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            fullname,
            username,
            avatar : avatar?.url || "",
            coverImage : coverImage?.url || ""
         }
      },
      {
         new: true
      }
   ).select("-password -refreshToken")

   if(!Updateduser){
      throw new ApiError(500,"Something Went Wrong While Updating User Details!!")
   }

   return res.status(200).json(
      new ApiResponse(200,Updateduser,"User Details Updated Successfully!!")
   )
})

const checkOldPassword = asynchandler(async(req,res)=>{
   //get data from frontend.
   //check user is logged in or not. middleware injected.
   //check old password is correct or not.
   //send response.
   // console.log(req.body)
   const {oldPassword} = req.body 
   const user = await User.findById(req.user._id)
   // console.log(user)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
   if(!isPasswordCorrect){
      throw new ApiError(401,"Incorrect Password!!")
   } 
   return res.status(200).json(
      new ApiResponse(200,{},"Password Verified!!")
   )
   
  
})

const updatePassword = asynchandler(async (req, res) => {
   const { newPassword } = req.body;
   validatePassword(newPassword)
   const user = await User.findById(req.user._id);
   user.password = newPassword;
   await user.save({validateBeforeSave : false});

  
   return res.status(200).json(
      new ApiResponse(200,{},"Password Updated Successfully!!")
   )
});

const deleteUser = asynchandler(async(req,res)=>{
   //check user is logged in or not.
   //delete user from database.
   //send response.
   //console.log(req.user)
   await User.findByIdAndDelete(req.user._id)  
   return res.status(200).json(
      new ApiResponse(200,{},"User Deleted Successfully!!")
   )
})

const getUserProfile = asynchandler(async(req,res)=>{
    const {username} = req.params
   //  console.log(username)
   //  console.log(req.user._id)
    if(!username?.trim()){
        throw new ApiError(400,"Username is Required!!")
    }
    const profile = await User.aggregate([
      {
         $match: {
            username: username?.toLowerCase()
         }
      },
      {
           $lookup: {
              from: "accounts",
              localField: "_id",
              foreignField: "following",
              as: "followers"
           }
      },
      {
         $lookup: {
            from: "accounts",
            localField: "_id",
            foreignField: "follower",
            as: "followings"
         }
      },
      {
         $addFields: {
            follower_count: {
               $size: "$followers"
            },
            following_count: {
               $size: "$followings"
            },
            isFollowing: {
               $cond: {
                  if: {
                     $in: [req.user._id, "$followers.follower"]
                  },
                  then: true,
                  else: false
               }  
            }
         }
      },
      {
         $project: {
            follower_count: 1,
            following_count: 1,
            username: 1,
            fullname: 1,
            avatar: 1,
            coverImage: 1,
            isFollowing: 1
         }
      }
    ])
   // console.log(profile)
   if(!profile?.length){
      throw new ApiError(404,"User Not Found!!")
   }

   return res.status(200).json(
      new ApiResponse(200,profile[0],"User Profile Fetched Successfully!!")
   )
})

// update user details //changepass //forgot password //delete account //email verification
export { Registeruser, loginUser, loggedOutUser,
    refreshAccessToken , changeUserDetails,checkOldPassword,updatePassword,deleteUser,getUserProfile};

