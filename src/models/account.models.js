import mongoose ,{Schema} from "mongoose";

const accountSchema = new Schema({
    follower:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    following:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

export const Account = mongoose.model("Account",accountSchema)