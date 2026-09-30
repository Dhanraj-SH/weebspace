import 'dotenv/config';
import jwt from 'jsonwebtoken';

export const generateRefershToken = (userId: string): string => {
   const secret = process.env.JWT_REFRESH_SECRET || 'alternativeSecret';
   
    return jwt.sign(
        {userId},
        secret,
        {expiresIn: "7d"}
    );
}