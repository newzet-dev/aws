import { simpleParser } from "mailparser";

export async function parseEmail(emailContent) {
  try {
    const parsed = await simpleParser(emailContent);

    const fromName = parsed.from?.value[0].name;
    const fromDomain = parsed.from?.value[0].address;
    const toDomain = parsed.to?.value[0].address;
    const maillingList = parsed.headers.get("list")?.id?.name ?? null;
    const htmlContent = parsed.html || "No HTML content";

    return { fromName, fromDomain, toDomain, maillingList, htmlContent };
  } catch (error) {
    throw new Error(`Failed to parse email: ${error.message}`);
  }
}
