import * as React from "react";
import {
  Button as BaseButton,
  ButtonProps as BaseButtonProps,
} from "../atoms/button";
import { cn } from "../../../lib/utils";
import { LucideIcon } from "lucide-react";

export interface ButtonWithIconProps extends BaseButtonProps {
  children?: React.ReactNode;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  iconOnly?: boolean;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  rounded?: "full" | "lg" | "none" | "sm" | "md";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonWithIconProps>(
  (
    {
      children,
      icon: Icon,
      iconPosition = "right",
      iconOnly = false,
      className,
      rounded = "full",
      ...props
    },
    ref,
  ) => {
    return (
      <BaseButton
        ref={ref}
        className={cn(
          "rounded-lg font-medium transition-colors",
          iconOnly ? "p-2.5" : "px-6 py-2.5",
          Icon && !iconOnly && "gap-2",
          rounded,
          className,
        )}
        {...props}
      >
        {Icon && iconPosition === "left" && !iconOnly && (
          <Icon className="h-4 w-4" />
        )}
        {!iconOnly && children}
        {Icon && iconPosition === "right" && !iconOnly && (
          <Icon className="h-4 w-4" />
        )}
        {Icon && iconOnly && <Icon className="h-4 w-4" />}
      </BaseButton>
    );
  },
);

Button.displayName = "Button";

export default Button;
