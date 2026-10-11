import 'dotenv/config';
import jwt from 'jsonwebtoken';

export const generateRefreshToken = (userId: string, tokenVersion: number): string => {
   const secret = process.env.JWT_REFRESH_SECRET;
   
    if(!secret){
        throw new Error("JWT_REFRESH_SECRET is not configured");
    }

    return jwt.sign(
        {userId, tokenVersion},
        secret,
        {expiresIn: "7d"}
    );
}