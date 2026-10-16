import { requireUserId, type AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { addToLibrary, getLibrary as getLibraryService, removeFromLibrary, updateLibraryStatus } from "../services/libraryService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { createLibrarySchema, libraryQuerySchema, updateLibrarySchema } from "../validators/libraryValidators.js";
import { mangaIdSchema } from "../validators/mangaValidators.js";

export const getLibrary = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { library, meta } = await getLibraryService(requireUserId(req), libraryQuerySchema.parse(req.query));

    sendSuccess(res, 200, library, { meta });
});

export const createLibrary = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const entry = await addToLibrary(requireUserId(req), createLibrarySchema.parse(req.body));

    sendSuccess(res, 201, entry, { message: "Added to library" });
});

export const updateLibrary = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);
    const entry = await updateLibraryStatus(requireUserId(req), mangaId, updateLibrarySchema.parse(req.body));

    sendSuccess(res, 200, entry, { message: "Library updated" });
});

export const deleteLibrary = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { mangaId } = mangaIdSchema.parse(req.params);
    const entry = await removeFromLibrary(requireUserId(req), mangaId);

    sendSuccess(res, 200, entry, { message: "Removed from library" });
});
