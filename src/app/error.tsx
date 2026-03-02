"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[GlobalError]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <div className="text-5xl font-bold text-blue-600">Oops</div>
        <h1 className="text-xl font-semibold text-gray-900">
          Something went wrong
        </h1>
        <p className="text-sm text-gray-500">
          An unexpected error occurred. Please try again or contact support if
          the problem persists.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-gray-100 p-3 text-left text-xs text-red-700">
            {error.message}
            {error.stack && `\n${error.stack}`}
          </pre>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
