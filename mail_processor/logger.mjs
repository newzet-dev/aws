export const logInfo = (message, metadata = {}) => {
  console.log(JSON.stringify({ level: "info", message, ...metadata }));
};

export const logError = (message, metadata = {}) => {
  console.error(JSON.stringify({ level: "error", message, ...metadata }));
};
