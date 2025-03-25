import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "ap-northeast-2" });

const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
};

export async function fetchS3Object(bucket, objectKey) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });

    const response = await s3Client.send(command);
    return streamToString(response.Body);
  } catch (error) {
    throw new Error(`Failed to fetch object from S3: ${error.message}`);
  }
}
