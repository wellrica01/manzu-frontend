"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      position="top-right"
      theme={theme}
      richColors
      toastOptions={{
        style: {
          borderRadius: "1rem",
          padding: "1.25rem",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          background: "rgba(255,255,255,0.9)",
          color: "#111", // title
          "--toast-description": "#333", // message text
        },
        classNames: {
          toast: "dark:bg-neutral-900 dark:border-neutral-800 dark:text-white",
          description: "dark:text-gray-300",
          actionButton:
            "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-400",
          cancelButton:
            "bg-gray-200 hover:bg-gray-300 text-black dark:bg-neutral-800 dark:text-white",
        },
        // Optional durations
        duration: 5000,
      }}
    />
  );
}
