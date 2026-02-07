import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const {
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT,
    R2_BUCKET_NAME,
} = process.env;

const client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

export const uploadFileToR2 = async (filePath, key, contentType) => {
    const fileStream = fs.createReadStream(filePath);

    const upload = new Upload({
        client,
        params: {
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: fileStream,
            ContentType: contentType,
        },
    });

    await upload.done();
    return key;
};
