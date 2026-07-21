import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center cursor-pointer gap-2 whitespace-nowrap  transition-colors outline-none ring-0 focus-visible:outline-none focus-visible:ring-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      colorSchema: {
        primary:
          "bg-surface-brand-default border-surface-brand-default text-neutral-primary hover:bg-surface-brand-hover hover:border-surface-brand-hover disabled:bg-surface-brand-disabled disabled:border-surface-brand-disabled focus-visible:border-brand-focus",
        warning:
          "bg-surface-warning-default border-surface-warning-default text-neutral-primary hover:bg-surface-warning-hover hover:border-surface-warning-hover disabled:bg-surface-warning-disabled disabled:border-surface-warning-disabled focus-visible:border-warning-focus",
        danger:
          "bg-surface-danger-default border-surface-danger-default text-neutral-primary hover:bg-surface-danger-hover hover:border-surface-danger-hover disabled:bg-surface-danger-disabled disabled:border-surface-danger-disabled focus-visible:border-danger-focus",
        neutral:
          "bg-surface-neutral-default border-surface-neutral-default text-neutral-primary hover:bg-surface-neutral-hover hover:border-surface-neutral-hover disabled:bg-surface-neutral-disabled disabled:border-surface-neutral-disabled focus-visible:border-neutral-focus",
      },
      variant: {
        primary: "border border-medium",
        ghost: "border border-dash border-medium",
        outline:
          "border border-medium bg-transparent hover:bg-transparent text-surface-default",
      },
      size: {
        default: "h-10 px-4 py-2 w-fit",
        xs: "h-[30px] px-3 w-fit",
        sm: "h-[36px] px-8 w-fit",
        icon: "h-10 w-10 w-fit",
        custom: "",
      },
      rounded: {
        full: "rounded-full",
        md: "rounded-md",
        lg: "rounded-lg",
        sm: "rounded-sm",
        none: "rounded-none",
      },
    },
    compoundVariants: [
      {
        variant: "primary",
        colorSchema: "primary",
        className:
          "border border-medium bg-surface-brand-default border-surface-brand-default text-neutral-primary hover:bg-surface-brand-hover hover:border-surface-brand-hover disabled:bg-surface-brand-disabled disabled:border-surface-brand-disabled focus-visible:border-brand-focus",
      },
      {
        variant: "primary",
        colorSchema: "warning",
        className:
          "border border-medium bg-surface-warning-default border-surface-warning-default text-neutral-primary hover:bg-surface-warning-hover hover:border-surface-warning-hover disabled:bg-surface-warning-disabled disabled:border-surface-warning-disabled focus-visible:border-warning-focus",
      },
      {
        variant: "primary",
        colorSchema: "danger",
        className:
          "border border-medium bg-surface-danger-default border-surface-danger-default text-neutral-primary hover:bg-surface-danger-hover hover:border-surface-danger-hover disabled:bg-surface-danger-disabled disabled:border-surface-danger-disabled focus-visible:border-danger-focus",
      },
      {
        variant: "primary",
        colorSchema: "neutral",
        className:
          "border border-medium bg-surface-neutral-default border-surface-neutral-default text-neutral-primary hover:bg-surface-neutral-hover hover:border-surface-neutral-hover disabled:bg-surface-neutral-disabled disabled:border-surface-neutral-disabled focus-visible:border-neutral-focus",
      },

      {
        variant: "ghost",
        colorSchema: "primary",
        className:
          "border border-dash border-medium bg-transparent border-surface-brand-default text-surface-brand-default hover:bg-surface-brand-hover/15 hover:border-surface-brand-hover disabled:border-surface-brand-disabled focus-visible:border-brand-focus",
      },
      {
        variant: "ghost",
        colorSchema: "warning",
        className:
          "border border-dash border-medium bg-transparent border-surface-warning-default text-surface-warning-default hover:bg-surface-warning-hover/15 hover:border-surface-warning-hover disabled:border-surface-warning-disabled focus-visible:border-warning-focus",
      },
      {
        variant: "ghost",
        colorSchema: "danger",
        className:
          "border border-medium border-dash bg-transparent border-surface-danger-default text-surface-danger-default hover:bg-surface-danger-hover/15 hover:border-surface-danger-hover disabled:border-surface-danger-disabled focus-visible:border-danger-focus",
      },
      {
        variant: "ghost",
        colorSchema: "neutral",
        className:
          "border border-medium border-dash bg-transparent border-surface-neutral-default text-surface-neutral-default hover:bg-surface-neutral-hover/15 hover:border-surface-neutral-hover disabled:border-surface-neutral-disabled focus-visible:border-neutral-focus",
      },

      {
        variant: "outline",
        colorSchema: "primary",
        className:
          "border border-medium bg-transparent border-surface-brand-default text-surface-brand-default hover:bg-surface-brand-hover/15 hover:border-surface-brand-hover disabled:border-surface-brand-disabled focus-visible:border-brand-focus",
      },
      {
        variant: "outline",
        colorSchema: "warning",
        className:
          "border border-medium bg-transparent border-surface-warning-default text-surface-warning-default hover:bg-surface-warning-hover/15 hover:border-surface-warning-hover disabled:border-surface-warning-disabled focus-visible:border-warning-focus",
      },
      {
        variant: "outline",
        colorSchema: "danger",
        className:
          "border border-medium bg-transparent border-surface-danger-default text-surface-danger-default hover:bg-surface-danger-hover/15 hover:border-surface-danger-hover disabled:border-surface-danger-disabled focus-visible:border-danger-focus",
      },
      {
        variant: "outline",
        colorSchema: "neutral",
        className:
          "border border-medium bg-transparent border-surface-neutral-default text-surface-neutral-default hover:bg-surface-neutral-hover/15 hover:border-surface-neutral-hover disabled:border-surface-neutral-disabled focus-visible:border-neutral-focus",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
      colorSchema: "primary",
      rounded: "full",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, colorSchema, size, asChild = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          buttonVariants({
            variant,
            size,
            colorSchema,
          }),
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
