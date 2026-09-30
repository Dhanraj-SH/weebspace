import 'dotenv/config';
import jwt from 'jsonwebtoken';

interface RefreshTokenPlayload{
    userId: string
}

export const verifyRefreshToken = (token: string): RefreshTokenPlayload => {
    const secret = process.env.JWT_REFRESH_SECRET || 'alternativeSecret';
    
    return jwt.verify(token, secret) as RefreshTokenPlayload;
}