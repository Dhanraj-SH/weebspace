import 'dotenv/config';
import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId: string): string => {
    const secret = process.env.JWT_ACCESS_SECRET;

    if(!secret){
        throw new Error("JJWT_ACCESS_SECRET is not configured")
    }

    return jwt.sign(
        {userId},
        secret,
        {expiresIn:"15m"}
    );
};