import 'dotenv/config';
import mongoose from 'mongoose';

export const connection = async(): Promise<void> =>{
    try{
        await mongoose.connect(process.env.MONGODB_URI as string);

        console.log("Mongodb Connect successfully");
    } catch(error){
        console.error("MongoDB connection failed", error);
        process.exit(1);
    }
};