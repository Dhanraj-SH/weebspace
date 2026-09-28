import bcrypt from 'bcrypt';
import { findUserByEmail, findUserByUsername, createUser } from '../repositories/userRepository.js';
import type { RegisterUserData } from '../validators/authValidators.js';

export const registerUser = async(userData: RegisterUserData) => {
    const existingEmail = await findUserByEmail(userData.email);

    if(existingEmail){
        throw new Error("Email is already registered");
    }

    const existingUsername = await findUserByUsername(userData.username);

    if(existingUsername){
        throw new Error("Username is already taken");
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