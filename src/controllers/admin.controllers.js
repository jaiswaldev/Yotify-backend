import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Music } from "../models/music.models.js";
import { isValidEmail } from "../utils/validations.js";
import { User } from "../models/user.models.js";
import { Admin } from "../models/admin.models.js";


const generateAccessAndRefereshTokens = async(adminId)=>{
  try{
    //  console.log(adminId)
     const admin = await Admin.findById(adminId)
    //  console.log(admin)
     const AccessToken = await admin.generateAccessToken()
    //  console.log(AccessToken)
     const RefreshToken = await admin.generateRefreshToken()
    //  console.log(RefreshToken)
     admin.refreshToken = RefreshToken;
     // console.log(user)
     await admin.save({validateBeforeSave: false})
  
    

     return {AccessToken,RefreshToken}

  }catch(error){
     throw new ApiError(500,"semething went wrong,while generating Tokens!!please try Again Later.")
  }
}



// const uploadMusic = asynchandler(async (req, res) => {
//   try {
//     const { title, description, artist } = req.body;

//     let musicfileLocalPath, thumbnailLocalPath;
//     if (req.files?.MusicFile?.[0]?.path) {
//       musicfileLocalPath = req.files.MusicFile[0].path;
//     }
//     if (req.files?.thumbnail?.[0]?.path) {
//       thumbnailLocalPath = req.files.thumbnail[0].path;
//     }

//     if (!musicfileLocalPath || !thumbnailLocalPath || !title || !description || !artist) {
//       throw new ApiError(400, "Please provide all the required fields");
//     }

//     const musicFileUpload = await uploadOnCloudinary(musicfileLocalPath);
//     const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

//     if (!musicFileUpload?.url || !thumbnailUpload?.url) {
//       throw new ApiError(500, "File upload failed");
//     }

//     const music = await Music.create({
//       MusicFile: musicFileUpload.url,
//       thumbnail: thumbnailUpload.url,
//       title,
//       description,
//       artist,
//     });

//     return res.status(201).json(
//       new ApiResponse(201, music, "Music uploaded successfully")
//     );
//   } catch (error) {
//     console.error("Error uploading music:", error);
//     throw new ApiError(
//       error.status || 500,
//       error.message || "An unexpected error occurred"
//     );
//   }
// });

const adminlogin = asynchandler(async (req, res) => {
  try {
    const { email, username, password } = req.body;
    // console.log(req.body);
    if (!username && !email) {
      throw new ApiError(400, "Please provide Registered username or Email!!");
    }

    if(email && !isValidEmail(email)){
      throw new ApiError(400, "Invalid Email!!");
    }
    const useradmin = await User.findOne({ 
        $or: [{email},{username}]
    });
    if (!useradmin) {
      throw new ApiError(404, "You Need to Register First!!");
    }
    const admin = await Admin.findOne({ 
        $or: [{email},{username}]
     });
    if (!admin) {
      throw new ApiError(404, "Admin not found!!");
    }

    const ispasswordValid = await useradmin.isPasswordCorrect(password);

    if (!ispasswordValid) {
      throw new ApiError(400, "Invalid Password!!");
    }

    const{AccessToken,RefreshToken} =  await generateAccessAndRefereshTokens(admin._id)

    const loggedInAdmin = await Admin.findById(admin._id).select(
      "-refreshToken"
    )
    const options= {
      httpOnly:true,
      secure:true
    }


    return res.status(200).cookie("accessToken",AccessToken,options)
    .cookie("refreshToken",RefreshToken,options).json(
       new ApiResponse(200,{
          admin: loggedInAdmin,
          AccessToken,
          RefreshToken
       },
    "Admin Logged In Successfully!!"))
  } catch (error) {
    throw new ApiError(
      error.status || 500,
      error.message || "An unexpected error occurred!!"
    );
  }
});










export { adminlogin };
