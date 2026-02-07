import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const getClient = () => {
    const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT } = process.env;

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
        throw new Error("Missing R2 credentials");
    }

    return new S3Client({
        region: "auto",
        endpoint: R2_ENDPOINT,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });
};

export const uploadFileToR2 = async (filePath, key, contentType) => {
    const fileStream = fs.createReadStream(filePath);
    const client = getClient();

    const upload = new Upload({
        client,
        params: {
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: fileStream,
            ContentType: contentType,
        },
    });

    await upload.done();
    return key;
};
