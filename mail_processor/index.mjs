import { parseEmail } from "./parser.mjs";
import { uploadParsedEmail } from "./parsedMailS3Uploader.mjs";
import { fetchS3Object } from "./incomingMailS3Fetcher.mjs";
import { sendMetadataToApiServer } from "./apiServerNotifier.mjs";
import { logInfo, logError } from "./logger.mjs";

export const handler = async (event) => {
  const batchItemFailures = [];

  logInfo("Batch processing started", { batchSize: event.Records.length });

  for (const record of event.Records) {
    try {
      const s3Event = JSON.parse(record.body).Records[0];
      const bucket = s3Event.s3.bucket.name;
      const objectKey = s3Event.s3.object.key;

      const emailContent = await fetchS3Object(bucket, objectKey);
      const parsed = await parseEmail(emailContent);
      const s3Link = await uploadParsedEmail(
        parsed.toDomain,
        objectKey,
        parsed.htmlContent
      );

      await sendMetadataToApiServer({
        fromName: parsed.fromName,
        fromDomain: parsed.fromDomain,
        toDomain: parsed.toDomain,
        mailingList: parsed.maillingList,
        s3Link,
        title: parsed.title,
      });
    } catch (error) {
      logError("Failed to process message", { error: error.message });
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  if (batchItemFailures.length > 0) {
    logError(`Failed to process ${batchItemFailures.length} events`);
  } else {
    logInfo("Batch processing completed successfully");
  }
  return { batchItemFailures };
};
