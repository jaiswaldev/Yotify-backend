import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken";

const adminSchema = new Schema({ 
    username:{
        type: String,
        required: true,
        unique: true,
        lowecase: true,
        trim : true,
        index: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowecase: true,
        trim : true
    },
    refreshToken:{
        type: String
    }
},{
    timestamps:true
})

adminSchema.methods.generateAccessToken = async function(){
    return jwt.sign(
        {
            _id:this._id,
            email : this.email,
            username: this.username
        },
       process.env.ACCESS_TOKEN_SECRET,
       {
         expiresIn:  process.env.ACCESS_TOKEN_EXPIRY
       }

    )
}

adminSchema.methods.generateRefreshToken = async function(){
    return jwt.sign(
        { 
            _id:this._id,
        },
       process.env.REFRESH_TOKEN_SECRET,
       {
         expiresIn:  process.env.REFRESH_TOKEN_EXPIRY
       }

    )
}

export const Admin =  mongoose.model("Admin",adminSchema)