import { toast as sonnerToast } from "sonner";
import { BadgeCheck, CircleX, Hourglass, OctagonAlert, X } from "lucide-react";

import { cn } from "../../../lib/utils";

interface ToastProps {
  title: string;
  description?: string;
  variant?: "success" | "error" | "info" | "warning";
  bottomBar?: boolean;
  duration?: number;
}

// Custom toast component that matches the design
export const ShowToast = ({
  title,
  description,
  variant = "success",
  bottomBar,
  duration = 3000,
}: ToastProps) => {
  const icons = {
    success: <img src="/svg/check.svg" alt="success" width={24} height={24} />,
    error: <img src="/svg/X.svg" alt="error" width={24} height={24} />,
    info: <img src="/svg/hourglass.svg" alt="info" width={24} height={24} />,
    warning: (
      <img src="/svg/warning.svg" alt="warning" width={24} height={24} />
    ),
  };

  const panelBg: Record<NonNullable<ToastProps["variant"]>, string> = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  };
  const accentBar: Record<NonNullable<ToastProps["variant"]>, string> = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  };
  const accentPill: Record<NonNullable<ToastProps["variant"]>, string> = {
    success: "bg-surface-elevated",
    error: "bg-surface-elevated",
    info: "bg-surface-elevated",
    warning: "bg-surface-elevated",
  };

  sonnerToast.custom(
    (t) => (
      <div className="relative">
        <div
          className={cn(
            "relative flex max-w-105 min-w-80 items-center gap-4 overflow-hidden rounded-lg bg-neutral-900 px-4 shadow-lg",
            "text-white/90 backdrop-blur-sm",
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute top-0 -left-5 -z-10 h-40 w-40 rounded-full opacity-20 blur-3xl",
              panelBg[variant],
            )}
          />
          <div
            className={cn(
              "h-8 w-8 shrink-0 rounded-full p-1",
              accentPill[variant],
            )}
          >
            {icons[variant]}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-2 py-4.75">
            <p className="text-body-lg-medium leading-tight text-neutral-50">
              {title}
            </p>

            {description && (
              <p className="text-body-md-regular mt-1 leading-tight text-neutral-400">
                {description}
              </p>
            )}
          </div>

          <button
            onClick={() => sonnerToast.dismiss(t)}
            className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Bottom accent bar */}
          {bottomBar && (
            <div
              className={cn(
                "absolute bottom-0 left-0 h-1 w-full rounded-b-lg",
                accentBar[variant],
              )}
            />
          )}
        </div>
      </div>
    ),
    {
      duration,
    },
  );
};

// Convenience functions for different toast types
export const toast = {
  success: (title: string, description?: string, duration?: number) =>
    ShowToast({ title, description, variant: "success", duration }),

  error: (title: string, description?: string, duration?: number) =>
    ShowToast({ title, description, variant: "error", duration }),

  info: (title: string, description?: string, duration?: number) =>
    ShowToast({ title, description, variant: "info", duration }),

  warning: (title: string, description?: string, duration?: number) =>
    ShowToast({ title, description, variant: "warning", duration }),
};

// Export the Toaster component that needs to be added to the layout
export { Toaster } from "../atoms/sonner";
