import https from "https";

const SERVER_URL = "iryfjrxudkoyigzzeplp.supabase.co";
const MAIL_RECEIVE_HOOK = "/functions/v1/mail_receive";

export async function sendMetadataToApiServer(metadata) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify(metadata);

    const options = {
      hostname: SERVER_URL,
      path: MAIL_RECEIVE_HOOK,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": requestData.length,
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `Failed to get Success Code from Server. Status: ${res.statusCode}`
          )
        );
      }
    });

    req.on("error", (e) => {
      reject(new Error(`Failed to send metadata to Server: ${e.message}`));
    });

    req.write(requestData);
    req.end();
  });
}
