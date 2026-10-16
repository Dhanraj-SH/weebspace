import { toAdminUser } from "../dtos/userDto.js";
import { requireUserId, type AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { changeUserRole, listUsers } from "../services/userService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { adminUsersQuerySchema, updateUserRoleSchema, userIdSchema } from "../validators/userValidator.js";

export const getAllUsers = asyncHandler(async (req, res) => {
    const { users, meta } = await listUsers(adminUsersQuerySchema.parse(req.query));

    sendSuccess(res, 200, users.map(toAdminUser), { meta });
});

export const updateRole = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const actorId = requireUserId(req);
    const { userId } = userIdSchema.parse(req.params);
    const { role } = updateUserRoleSchema.parse(req.body);

    const user = await changeUserRole(actorId, userId, role);

    sendSuccess(res, 200, toAdminUser(user), { message: "User role updated" });
});
