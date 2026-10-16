import { toOwnUser, toPublicUser } from "../dtos/userDto.js";
import { requireUserId, type AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getUserProfile, updateProfile } from "../services/userService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { updateProfileSchema, userIdSchema } from "../validators/userValidator.js";

export const getMe = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const user = await getUserProfile(requireUserId(req));

    sendSuccess(res, 200, toOwnUser(user));
});

export const updateMe = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const user = await updateProfile(requireUserId(req), updateProfileSchema.parse(req.body));

    sendSuccess(res, 200, toOwnUser(user), { message: "Profile updated" });
});

export const getUserById = asyncHandler(async (req, res) => {
    const { userId } = userIdSchema.parse(req.params);
    const user = await getUserProfile(userId);

    sendSuccess(res, 200, toPublicUser(user));
});
