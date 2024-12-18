import { cn } from "@/utils/cn";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none [&_svg]:disabled:fill-icon-disabled",
  {
    variants: {
      variant: {
        primary:
          "justify-center text-text-button-primary [&_svg]:fill-icon-button-primary bg-button-surface-primary disabled:text-text-disabled disabled:bg-button-surface-disabled hover:bg-primary-400 dark:hover:bg-primary-600 focus-visible:outline-none ring-offset-primary-200 focus-visible:ring-primary-200 dark:focus-visible:ring-primary-700 focus-visible:ring-offset-0 focus-visible:ring-2 active:bg-primary-600 dark:active:bg-primary-400",
        secondary:
          "justify-center text-text-button-secondary [&_svg]:icon-fill-text-button-secondary outline outline-1 outline-button-border-primary disabled:text-text-disabled disabled:outline-border-disabled hover:bg-primary-25 dark:hover:bg-primary-900 focus-visible:ring-primary-200 focus-visible:ring-primary-200 dark:focus-visible:ring-primary-700 focus-visible:ring-2 active:bg-primary-50 dark:active:bg-primary-850",
        ghost:
          "justify-center text-text-action disabled:text-text-disabled dark:hover:bg-primary-900 dark:hover:text-primary-50 hover:bg-primary-25 focus-visible:outline-none focus-visible:ring-primary-200 dark:focus-visible:ring-primary-700 focus-visible:ring-offset-0 focus-visible:ring-2 active:bg-primary-50 dark:active:bg-primary-850 dark:active:text-primary-50",
        warning:
          "justify-center text-neutral-0 bg-warning-400 hover:bg-warning dark:hover:bg-warning-700 focus-visible:ring-warning-300 dark:focus-visible:ring-warning-700 focus-visible:ring-2 active:bg-warning-400 active:outline-error-600 dark:active:bg-error-600 dark:active:outline-error-400 disabled:text-text-disabled disabled:cursor-not-allowed",
        warning_outline:
          "justify-center text-warning outline outline-1 outline-button-border-warning hover:bg-warning-100 dark:hover:bg-warning-700 focus-visible:ring-warning-300 dark:focus-visible:ring-warning-700 focus-visible:ring-2 active:bg-warning-400 active:outline-warning-600 dark:active:bg-warning-600 dark:active:outline-warning-400 disabled:text-text-disabled disabled:cursor-not-allowed",
        destructive:
          "justify-center text-neutral-0 bg-button-border-error hover:bg-error-400 dark:hover:bg-error-700 focus-visible:ring-error-300 dark:focus-visible:ring-error-700 focus-visible:ring-2 active:bg-error-400 active:outline-error-600 dark:active:bg-error-600 dark:active:outline-error-400 disabled:text-text-disabled disabled:cursor-not-allowed",
        destructive_outline:
          "justify-center text-button-text-error outline outline-1 outline-button-border-error hover:bg-error-100 dark:hover:bg-error-700 focus-visible:ring-error-300 dark:focus-visible:ring-error-700 focus-visible:ring-2 active:bg-error-400 active:outline-error-600 dark:active:bg-error-600 dark:active:outline-error-400 disabled:text-text-disabled disabled:cursor-not-allowed",
        input:
          "justify-between text-left ring-none flex h-8 rounded-lg border border-form-border-primary bg-form-surface-primary p-2 text-sm ring-inset transition-colors file:text-sm file:font-medium placeholder:text-text-secondary hover:bg-neutral-25 focus-visible:border-border-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 disabled:cursor-not-allowed disabled:border-form-border-disabled disabled:bg-form-surface-disabled disabled:text-text-disabled dark:hover:bg-form-surface-disabled dark:hover:bg-neutral-800 dark:focus-visible:ring-primary-700 [&_svg]:focus-visible:fill-icon-tertiary [&_svg]:disabled:fill-icon-disabled",
      },
      size: {
        default: "h-8 px-4",
        icon: "h-8 px-1.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

export default Button;
