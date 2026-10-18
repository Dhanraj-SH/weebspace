import { createPresignedUpload } from "../services/uploadService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { presignUploadSchema } from "../validators/uploadValidators.js";

export const presignUpload = asyncHandler(async (req, res) => {
    sendSuccess(res, 200, await createPresignedUpload(presignUploadSchema.parse(req.body)));
});