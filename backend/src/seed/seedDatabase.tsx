import "dotenv/config";
import mongoose from "mongoose";

import { User } from "../models/userModel.js";
import { Manga } from "../models/mangaModel.js";
import { Chapter } from "../models/chapterModel.js";
import { Library } from "../models/libraryModel.js";
import { ReadingProgress } from "../models/readingProgressModel.js";
import { Rating } from "../models/ratingModel.js";
import { Review } from "../models/reviewModel.js";
import { Comment } from "../models/commentModel.js";

import { connection } from "../config/database.js";

const seedDatabase = async (): Promise<void> => {
    try {
        await connection();

        console.log("Clearing existing data...");

        await Promise.all([
            User.deleteMany({}),
            Manga.deleteMany({}),
            Chapter.deleteMany({}),
            Library.deleteMany({}),
            ReadingProgress.deleteMany({}),
            Rating.deleteMany({}),
            Review.deleteMany({}),
            Comment.deleteMany({}),
        ]);

        console.log("Existing data cleared.");

        const users = await User.insertMany([
            {
                name: "Dhanraj",
                username: "dhanraj",
                email: "dhanraj@weebspace.dev",
                role: "user",
            },
            {
                name: "Demo User",
                username: "demouser",
                email: "demo@weebspace.dev",
                role: "user",
            },
        ]);

        const manga = await Manga.insertMany([
            {
                title: "One Piece",
                alternativeTitles: ["OP"],
                description:
                    "A young pirate sets out on an adventure to find the legendary One Piece.",
                authors: ["Eiichiro Oda"],
                artists: ["Eiichiro Oda"],
                genres: [
                    "action",
                    "adventure",
                    "comedy",
                    "fantasy",
                    "shounen",
                ],
                status: "ongoing",
            },
            {
                title: "Attack on Titan",
                alternativeTitles: ["Shingeki no Kyojin"],
                description:
                    "Humanity fights for survival against mysterious giant creatures known as Titans.",
                authors: ["Hajime Isayama"],
                artists: ["Hajime Isayama"],
                genres: [
                    "action",
                    "drama",
                    "fantasy",
                    "military",
                    "mystery",
                    "shounen",
                ],
                status: "completed",
            },
            {
                title: "Unknown Manga",
                alternativeTitles: [],
                description: "A manga with incomplete metadata.",
                authors: ["Unknown"],
                artists: ["Unknown"],
                genres: ["unknown"],
                status: "ongoing",
            },
        ]);

        const chapters = await Chapter.create([
            {
                mangaId: manga[0]!._id,
                chapterNumber: 1,
                title: "Romance Dawn",
                pages: [
                    "https://example.com/one-piece/chapter-1/page-1.jpg",
                    "https://example.com/one-piece/chapter-1/page-2.jpg",
                ],
                publishedAt: new Date(),
            },
            {
                mangaId: manga[0]!._id,
                chapterNumber: 2,
                title: "They Call Him Straw Hat",
                pages: [
                    "https://example.com/one-piece/chapter-2/page-1.jpg",
                    "https://example.com/one-piece/chapter-2/page-2.jpg",
                ],
                publishedAt: new Date(),
            },
            {
                mangaId: manga[1]!._id,
                chapterNumber: 1,
                title: "To You, in 2000 Years",
                pages: [
                    "https://example.com/aot/chapter-1/page-1.jpg",
                    "https://example.com/aot/chapter-1/page-2.jpg",
                ],
                publishedAt: new Date(),
            },
        ]);

        await Library.insertMany([
            {
                userId: users[0]!._id,
                mangaId: manga[0]!._id,
                status: "reading",
            },
            {
                userId: users[0]!._id,
                mangaId: manga[1]!._id,
                status: "completed",
            },
            {
                userId: users[1]!._id,
                mangaId: manga[0]!._id,
                status: "planToRead",
            },
        ]);

        await ReadingProgress.create([
            {
                userId: users[0]!._id,
                mangaId: manga[0]!._id,
                chapterId: chapters[0]!._id,
                pageNumber: 2,
                completed: false,
                lastReadAt: new Date(),
            },
        ]);

        await Rating.create([
            {
                userId: users[0]!._id,
                mangaId: manga[0]!._id,
                value: 5,
            },
            {
                userId: users[1]!._id,
                mangaId: manga[0]!._id,
                value: 4,
            },
            {
                userId: users[0]!._id,
                mangaId: manga[1]!._id,
                value: 5,
            },
        ]);

        const reviews = await Review.create([
            {
                userId: users[0]!._id,
                mangaId: manga[0]!._id,
                rating: 5,
                content:
                    "One of my favorite adventure manga. The world building is incredible.",
            },
            {
                userId: users[1]!._id,
                mangaId: manga[1]!._id,
                rating: 5,
                content:
                    "A great story with strong characters and a memorable ending.",
            },
        ]);

        const firstComment = await Comment.create({
            userId: users[0]!._id,
            mangaId: manga[0]!._id,
            content: "This manga is incredible!",
        });

        await Comment.create([
            {
                userId: users[1]!._id,
                mangaId: manga[0]!._id,
                content: "Absolutely agree!",
                parentCommentId: firstComment._id,
            },
            {
                userId: users[1]!._id,
                mangaId: manga[0]!._id,
                chapterId: chapters[0]!._id,
                content: "That chapter was amazing!",
            },
        ]);

        console.log("Database seeded successfully.");

        console.log({
            users: users.length,
            manga: manga.length,
            chapters: chapters.length,
            reviews: reviews.length,
        });
    } catch (error) {
        console.error("Database seeding failed:", error);
    } finally {
        await mongoose.connection.close();
        console.log("Database connection closed.");
    }
};

seedDatabase();