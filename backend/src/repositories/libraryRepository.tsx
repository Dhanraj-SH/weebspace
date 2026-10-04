import { Library, LibraryStatus, type ILibrary } from "../models/libraryModel.js";
import type { CreateLibraryData, UpdateLibraryData } from "../validators/libraryValidators.js";

export const findLibraryByUserId = async(userId: string): Promise<ILibrary[]> => {
    return Library.find({userId}).sort({updatedAt: -1});
};

export const createLibraryEntry = async(userId: string, libraryData: CreateLibraryData): Promise<ILibrary> => {
    return Library.create({userId, ...libraryData});
};

export const updateLibraryEntry = async(userId: string, mangaId:string, libraryData: UpdateLibraryData): Promise<ILibrary | null> => {
    return Library.findOneAndUpdate({
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
    return Library.findOneAndDelete({
        userId,
        mangaId
    });
};