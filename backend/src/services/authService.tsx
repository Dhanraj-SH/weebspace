import bcrypt from 'bcrypt';
import { findUserByEmail, findUserByUsername, createUser, findUserByIdentifierWithPassword } from '../repositories/userRepository.js';
import type { RegisterUserData, LoginUserData } from '../validators/authValidators.js';
import { AppError } from '../utils/appError.js';
import { generateToken } from '../utils/generateToken.js';

export const registerUser = async(userData: RegisterUserData) => {
    const existingEmail = await findUserByEmail(userData.email);

    if(existingEmail){
        throw new AppError("Email is already registered", 409);
    }

    const existingUsername = await findUserByUsername(userData.username);

    if(existingUsername){
        throw new AppError("Username is already taken", 409);
    }

    const hashPassword = await bcrypt.hash(userData.password, 10);

    const user = await createUser({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        password: hashPassword
    });

    return user;
};

export const loginUser = async(userData: LoginUserData) => {
    const user = await findUserByIdentifierWithPassword(userData.identifier);

    if(!user || !user.password){
        throw new AppError("Invalid Credentails", 401);
    }

    const passwordMatches = await bcrypt.compare(userData.password, user.password);

    if(!passwordMatches){
        throw new AppError("Invalid credentails", 401);
    }

    const token = generateToken(user._id.toString());

    return {
        user,
        token
    };
};