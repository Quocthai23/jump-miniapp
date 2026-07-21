import React from "react";

type SwitchSize = "sm" | "md" | "lg" | "xl";

interface CustomSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  size?: SwitchSize;
}

const sizeConfig = {
  sm: {
    container: "h-4 w-7",
    thumb: "h-3 w-3",
    translateOn: "translate-x-3",
    translateOff: "translate-x-0.5",
  },
  md: {
    container: "h-6 w-11",
    thumb: "h-4 w-4",
    translateOn: "translate-x-6",
    translateOff: "translate-x-1",
  },
  lg: {
    container: "h-7 w-14",
    thumb: "h-5 w-5",
    translateOn: "translate-x-8",
    translateOff: "translate-x-1",
  },
  xl: {
    container: "h-8 w-16",
    thumb: "h-6 w-6",
    translateOn: "translate-x-9",
    translateOff: "translate-x-1",
  },
};

export const CustomSwitch: React.FC<CustomSwitchProps> = ({
  checked,
  onCheckedChange,
  className = "",
  disabled = false,
  size = "md",
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onCheckedChange(!checked);
    }
  };

  const config = sizeConfig[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${checked ? "bg-[#0187FF]" : "bg-[rgba(120,120,128,0.16)]"} ${config.container} ${className} `}
    >
      <span
        className={`inline-block rounded-full bg-white transition-transform duration-200 ease-in-out ${config.thumb} ${checked ? config.translateOn : config.translateOff} `}
      />
    </button>
  );
};
