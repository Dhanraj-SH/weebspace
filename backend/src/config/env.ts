import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    MONGODB_URI: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(6, "JWT_ACCESS_SECRET must be at least 6 characters"),
    JWT_REFRESH_SECRET: z.string().min(6, "JWT_REFRESH_SECRET must be at least 6 characters"),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_CALLBACK_URL: z.string().min(1).optional(),
    FRONTEND_URL: z.string().min(1).default("http://localhost:5173"),
    COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("none"),
    CORS_ORIGINS: z.string().default("http://localhost:5173"),
    ADMIN_EMAIL: z.string().optional(),
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    R2_ENDPOINT: z.url().optional(),
    R2_PUBLIC_URL: z.url().optional(),
    COOKIE_DOMAIN: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
        for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const) {
            if (data[key].length < 32) {
                ctx.addIssue({
                    code: "custom",
                    message: `${key} must be at least 32 characters in production.`,
                    path: [key],
                });
            }
        }
    }

    const r2Values = [
        data.R2_ACCOUNT_ID,
        data.R2_ENDPOINT,
        data.R2_ACCESS_KEY_ID,
        data.R2_SECRET_ACCESS_KEY,
        data.R2_BUCKET_NAME,
    ];

    const configuredCount = r2Values.filter(Boolean).length;

    if (configuredCount > 0 && configuredCount < r2Values.length) {
        ctx.addIssue({
            code: "custom",
            message: "All R2 environment variables must be configured together.",
            path: ["R2_ENDPOINT"],
        });
    }

    if (data.NODE_ENV === "production" && data.COOKIE_SAME_SITE !== "none" && !data.COOKIE_DOMAIN) {
        ctx.addIssue({
            code: "custom",
            message: "Cross-site production deployments require COOKIE_SAME_SITE=none unless COOKIE_DOMAIN is configured for shared-site hosting.",
            path: ["COOKIE_SAME_SITE"],
        });
    }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment configuration:");
    for (const issue of parsed.error.issues) {
        console.error(` - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
