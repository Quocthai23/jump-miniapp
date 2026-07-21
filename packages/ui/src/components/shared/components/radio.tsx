import React from "react";
import { RadioGroup, RadioGroupItem } from "../atoms/radio-group";
import { cn } from "../../../lib/utils";

interface RadioProps {
  enabled?: boolean;
  setEnabled?: (enabled: boolean) => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const RadioDemo: React.FC<RadioProps> = ({
  enabled,
  setEnabled,
  title,
  description,
  size = "md",
  className,
}) => {
  const id = React.useId();

  return (
    <div
      className={cn(
        "flex items-center",
        className,
        size === "sm" && "gap-[4px]",
        size === "md" && "gap-[8px]",
        size === "lg" && "gap-[12px]",
      )}
    >
      <RadioGroup
        value={enabled ? "on" : "off"}
        onValueChange={(val) => setEnabled?.(val === "on")}
        className="grid gap-0"
        aria-label="Enabled radio"
      >
        <RadioGroupItem
          id={id}
          value="on"
          className={cn(
            "border-[var(--color-neutral-600)] data-[state=checked]:border-[var(--color-primary-500)] data-[state=checked]:text-[var(--color-primary-500)]",
            size === "sm" && "h-[16px] w-[16px]",
            size === "md" && "h-[20px] w-[20px]",
            size === "lg" && "h-[24px] w-[24px]",
          )}
        />
        {/* Hidden 'off' item to keep the group controlled */}
        <RadioGroupItem value="off" className="hidden" />
      </RadioGroup>

      <div className="flex flex-col">
        {title && (
          <label
            htmlFor={id}
            className={cn(
              "text-neutral-primary cursor-pointer",
              className,
              size === "sm" && "typography-body-sm-medium",
              size === "md" && "typography-body-md-medium",
              size === "lg" && "typography-body-lg-medium",
            )}
          >
            {title}
          </label>
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

export default RadioDemo;
