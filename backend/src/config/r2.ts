import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.js";

let client: S3Client | undefined;

export const getR2 = () => {
    const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT } = env;

    if(!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT) {
        throw new Error("Cloudflare R2 is not configured. Check R2 environment variable");
    }

    client ??= new S3Client({
        region: "auto",
        endpoint: R2_ENDPOINT,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY
        },
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
    });

    return { client, bucket: R2_BUCKET_NAME };
};