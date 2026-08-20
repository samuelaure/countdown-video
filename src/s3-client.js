import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const getClient = () => {
  const {
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT,
    R2_BUCKET_NAME,
  } = process.env;

  if (
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_ENDPOINT ||
    !R2_BUCKET_NAME
  ) {
    throw new Error(
      "Missing R2 credentials (ID, Secret, Endpoint, or Bucket Name)",
    );
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

/**
 * Removes objects from the bucket. Called once Instagram has published the
 * reel: from that point the platform serves its own copies, so keeping ours
 * only consumes quota. Failure is not fatal — a leftover file is cheaper than
 * a failed run that already published.
 */
export const deleteFilesFromR2 = async (keys) => {
  if (!keys.length) return;
  const client = getClient();

  await client.send(
    new DeleteObjectsCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    }),
  );
};
