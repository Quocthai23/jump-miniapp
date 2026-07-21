import React from "react";
import { Checkbox as UICheckbox } from "../atoms/checkbox";
import { cn } from "../../../lib/utils";

interface CheckboxProps {
  enabled?: boolean;
  setEnabled?: (enabled: boolean) => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const CheckboxDemo: React.FC<CheckboxProps> = ({
  enabled,
  setEnabled,
  title,
  description,
  size = "md",
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center",
        className,
        size === "sm" && "gap-1",
        size === "md" && "gap-2",
        size === "lg" && "gap-3",
      )}
    >
      <UICheckbox
        checked={enabled}
        onCheckedChange={(value) => setEnabled?.(Boolean(value))}
        aria-label="Enabled checkbox"
        className={cn(
          "data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-50 border-neutral-200 data-[state=unchecked]:border-neutral-200",
          size === "sm" && "h-4 w-4",
          size === "md" && "h-5 w-5",
          size === "lg" && "h-6 w-6",
        )}
      />
      <div className="flex flex-col">
        {title && (
          <p
            className={cn(
              "text-neutral-primary",
              className,
              size === "sm" && "typography-body-sm-medium",
              size === "md" && "typography-body-md-medium",
              size === "lg" && "typography-body-lg-medium",
            )}
          >
            {title}
          </p>
        )}
        {description && (
          <p
            className={cn(
              "text-text-neutral-secondary",
              className,
              size === "sm" && "typography-body-xs-regular",
              size === "md" && "typography-body-sm-regular",
              size === "lg" && "typography-body-md-regular",
            )}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default CheckboxDemo;
