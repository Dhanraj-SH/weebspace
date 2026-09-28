import "dotenv/config"
import jwt from "jsonwebtoken";

export const generateToken = (userId: string) => {
    const secret = process.env.JWT_SECRET || "alternativeSecert";

    return jwt.sign(
        {userId}, 
        secret, 
        {expiresIn: "7d"}
    );
};