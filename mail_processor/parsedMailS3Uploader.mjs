import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const bucketName = "newzet-parsed-emails-bucket";
const contentType = "text/html";
const s3Client = new S3Client({ region: "ap-northeast-2" });

export async function uploadParsedEmail(toDomain, objectKey, htmlContent) {
  const date = new Date();
  const today = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  const newKey = `${toDomain}_${today}_${objectKey}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: newKey,
      Body: htmlContent,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return newKey;
  } catch (error) {
    throw new Error(`Failed to upload parsed email to S3: ${error.message}`);
  }
}
