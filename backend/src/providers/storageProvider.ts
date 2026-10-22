import { DeleteObjectCommand, DeleteObjectsCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2 } from "../config/r2.js";

export const UPLOAD_URL_EXPIRES_IN = 300;

export const createUploadUrl = async (key: string, contentType: string): Promise<string> => {
    const { client, bucket } = getR2();

    return await getSignedUrl(
        client,
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
        }),{
            expiresIn: UPLOAD_URL_EXPIRES_IN,
            signableHeaders: new Set(["content-type"]),
        }
    );
};

export const headObject = async (key: string): Promise<{ contentType: string | undefined, size: number | undefined } | null> => {
    const {client, bucket} = getR2();

    try{
        const result = await client.send(
            new HeadObjectCommand({
                Bucket: bucket,
                Key: key
            })
        );

        return { contentType: result.ContentType, size: result.ContentLength }
    } catch(error) {
        const failure = error as { name?: string; $metadata?: { httpStatusCode?: number } };

        if (failure.name === "NotFound" || failure.$metadata?.httpStatusCode === 404) {
            return null;
        }

        throw error;
    }
};

export const deleteObject = async(key: string):Promise<void> => {
    const { client, bucket } = getR2();

    await client.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        })
    );
};

export const deleteByPrefix = async (prefix: string): Promise<void> => {
    const { client, bucket } = getR2();
    let continuationToken: string | undefined;

    do {
        const listed = await client.send(
            new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: prefix,
                ...(continuationToken ? { ContinuationToken: continuationToken } : {}),
            })
        );

        const keys = (listed.Contents ?? []).flatMap((object) => (object.Key ? [{ Key: object.Key }] : []));

        if (keys.length > 0) {
            await client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys, Quiet: true } }));
        }

        continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (continuationToken);
};