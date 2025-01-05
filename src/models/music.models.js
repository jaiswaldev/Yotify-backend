import mongoose ,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const musicSchema = new Schema({
   MusicFile:{
    type:String,
    required:true
   },
   thumbnail:{
    type:String,
    required:true
   },
   title:{
    type:String,
    required:true
   },
   description:{
    type:String,
    required:true
   },
   duration:{
    type:Number,
    required:true
   },
   views:{
    type:Number,
    default: 0
   },
   ispublished:{
    type:boolean,
    default:true
   },
   owner:{
     type: Schema.Types.ObjectId,
     ref:"User"
   },


},{
    timestamps:true
})


musicSchema.plugin(mongooseAggregatePaginate)


export const Music = mongoose.model("Music",musicSchema)