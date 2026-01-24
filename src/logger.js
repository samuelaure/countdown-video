/**
 * Structured logging utility
 */
const logger = {
  info: (message, meta) => {
    console.log(
      JSON.stringify({
        level: "INFO",
        timestamp: new Date().toISOString(),
        message,
        meta,
      }),
    );
  },
  error: (message, error) => {
    const errorDetails = {
      message: error?.message || String(error),
      stack: error?.stack,
    };

    if (error?.isAxiosError) {
      errorDetails.axios = {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      };
    }

    console.error(
      JSON.stringify({
        level: "ERROR",
        timestamp: new Date().toISOString(),
        message,
        error: errorDetails,
      }),
    );
  },
};

export default logger;
