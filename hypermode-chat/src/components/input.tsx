import { cn } from "@/utils/cn"
import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "ring-none flex h-8 w-full rounded-lg border border-form-border-primary bg-form-surface-primary p-2 text-sm ring-inset transition-colors file:text-sm file:font-medium placeholder:text-text-secondary hover:bg-neutral-25 focus-visible:border-border-action focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-200 disabled:cursor-not-allowed disabled:border-form-border-disabled disabled:bg-form-surface-disabled disabled:text-text-disabled dark:hover:bg-form-surface-disabled dark:hover:bg-neutral-800 dark:focus-visible:ring-primary-700 focus-visible:[&_svg]:fill-icon-tertiary disabled:[&_svg]:fill-icon-disabled file:border-0 file:bg-transparent",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
