import 'dotenv/config';
import jwt from 'jsonwebtoken';

interface RefreshTokenPlayload{
    userId: string,
    tokenVersion: number
}

export const verifyRefreshToken = (token: string): RefreshTokenPlayload => {
    const secret = process.env.JWT_REFRESH_SECRET;

    if(!secret){
        throw new Error("JWT_REFRESH_SECRET is not configured");
    }
    
    const decoded = jwt.verify(token, secret);

    
    if ( typeof decoded === "string" || typeof decoded.userId !== "string" || typeof decoded.tokenVersion !== "number" ) {
        throw new Error("Invalid refresh token payload");
    }

    return decoded as RefreshTokenPlayload;
}