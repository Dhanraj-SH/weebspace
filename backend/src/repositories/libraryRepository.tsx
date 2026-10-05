import { Library, type ILibrary } from "../models/libraryModel.js";
import type { CreateLibraryData, UpdateLibraryData } from "../validators/libraryValidators.js";

export const findLibraryByUserId = async(userId: string): Promise<ILibrary[]> => {
    return await Library.find({userId}).sort({updatedAt: -1});
};

export const createLibraryEntry = async(userId: string, libraryData: CreateLibraryData): Promise<ILibrary> => {
    return await Library.create({userId, ...libraryData});
};

export const updateLibraryEntry = async(userId: string, mangaId:string, libraryData: UpdateLibraryData): Promise<ILibrary | null> => {
    return await Library.findOneAndUpdate({
        userId,
        mangaId,
    },{
        $set: libraryData
    },{
        returnDocument: 'after',
        runValidators: true
    });
};

export const deleteLibraryEntry = async(userId: string, mangaId: string): Promise<void | null> => {
    return await Library.findOneAndDelete({
        userId,
        mangaId
    });
};