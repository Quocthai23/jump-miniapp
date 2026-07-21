import type { ReactNode } from "react";
import { Button } from "packages/ui/src/components/shared/atoms/button";

type ButtonSize = "lg" | "md" | "sm";
type ButtonRounded = "full" | "xs" | "md" | "sm";
type ColorSchema = "primary" | "warning" | "error" | "neutral" | "success";

interface ButtonCustomProps {
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  children?: ReactNode;
  size?: ButtonSize;
  rounded?: ButtonRounded;
  colorSchema?: ColorSchema;
  className?: string;
}

const sizeClassNames: Record<ButtonSize, string> = {
  lg: "text-button-lg-medium!",
  md: "text-button-md-medium!",
  sm: "text-button-sm-medium!",
};

const sizeBorderClassNames: Record<ButtonSize, string> = {
  lg: "border-2",
  md: "border",
  sm: "border",
};

const colorClassNames: Record<ColorSchema, string> = {
  primary:
    "bg-primary-500 border-primary-500 text-neutral-50 hover:bg-primary-600 hover:border-primary-600/30 hover:text-neutral-50 active:bg-primary-700 active:border-primary-400 active:text-primary-100 disabled:bg-primary-900 disabled:border-primary-900 disabled:text-primary-800",
  warning:
    "bg-yellow-500 border-yellow-500 text-neutral-50 hover:bg-yellow-600 hover:border-yellow-600/30 hover:text-neutral-50 active:bg-yellow-700 active:border-yellow-400 active:text-yellow-100 disabled:bg-yellow-900 disabled:border-yellow-900 disabled:text-yellow-800",
  error:
    "bg-red-500 border-red-500 text-neutral-50 hover:bg-red-600 hover:border-red-600/30 hover:text-neutral-50 active:bg-red-700 active:border-red-400 active:text-red-100 disabled:bg-red-900 disabled:border-red-900 disabled:text-red-800",
  neutral:
    "bg-neutral-500 border-neutral-500 text-neutral-50 hover:bg-neutral-600 hover:border-neutral-600/30 hover:text-neutral-50 active:bg-neutral-700 active:border-neutral-400 active:text-neutral-100 disabled:bg-neutral-900 disabled:border-neutral-900 disabled:text-neutral-800",
  success:
    "bg-green-500 border-green-500 text-neutral-50 hover:bg-green-600 hover:border-green-600/30 hover:text-neutral-50 active:bg-green-700 active:border-green-400 active:text-green-100 disabled:bg-green-900 disabled:border-green-900 disabled:text-green-800",
};

export const ButtonCustom = ({
  onClick,
  disabled,
  isLoading,
  children,
  size = "lg",
  rounded = "full",
  colorSchema = "primary",
  className,
}: ButtonCustomProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${colorClassNames[colorSchema]} h-full w-full rounded-${rounded} ${sizeBorderClassNames[size]} py-2 transition-colors disabled:cursor-not-allowed ${sizeClassNames[size]} ${className}`}
    >
      {children}
    </Button>
  );
};
