import mongoose ,{Schema} from "mongoose";

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
    }
},{
    timestamps:true
})

export const Admin =  mongoose.model("Admin",adminSchema)