import { z } from "zod";

export const saveRatingSchema = z.object({
    value: z.number().int().min(1).max(5),
});

export type SaveRatingData = z.infer<typeof saveRatingSchema>;
