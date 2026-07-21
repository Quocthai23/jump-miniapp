import React from "react";
import { Switch as UISwitch } from "../atoms/switch";
import { cn } from "../../../lib/utils";

interface SwitchProps {
  enabled?: boolean;
  setEnabled?: (enabled: boolean) => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SwitchDemo: React.FC<SwitchProps> = ({
  enabled,
  setEnabled,
  title,
  description,
  size,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center",
        size === "sm" && "gap-[4px]",
        size === "md" && "gap-[8px]",
        size === "lg" && "gap-[12px]",
      )}
    >
      <UISwitch
        checked={enabled}
        onCheckedChange={setEnabled}
        className={cn(
          "data-[state=checked]:bg-[#03c987] data-[state=unchecked]:bg-[#374151] [&>span]:bg-white",
          size === "sm" && "h-[18px] w-[32px]",
          size === "md" && "h-[24px] w-[44px]",
          size === "lg" && "h-[28px] w-[52px]",
        )}
        aria-label="Enabled switch"
      />
      <div className="flex flex-col">
        {title && (
          <p
            className={cn(
              "typography-body-sm-medium",
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
              "typography-body-xs-regular",
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

export default SwitchDemo;
