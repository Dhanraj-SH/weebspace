import { Library, type ILibrary } from "../models/libraryModel.js";

export const findLibraryByUserId = async(userId: string): Promise<ILibrary[]> => {
    return Library.find({userId}).sort({updatedAt: -1});
};