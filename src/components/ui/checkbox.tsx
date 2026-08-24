"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked, onChange, ...props }, ref) => {
    return (
      <label className="flex cursor-pointer items-center space-x-3 group">
        <div className="relative">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            checked={checked}
            onChange={onChange}
            {...props}
          />
          <div
            className={cn(
              "h-5 w-5 rounded-md border-2 transition-all duration-150",
              checked
                ? "border-accent bg-accent"
                : "border-line bg-surface group-hover:border-accent/50",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper",
              className
            )}
          >
            {checked && (
              <svg
                className="h-full w-full p-0.5 text-white"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
        {label && (
          <span className="text-sm text-ink transition-colors group-hover:text-accent">
            {label}
          </span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
