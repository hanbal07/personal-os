"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked, onChange, ...props }, ref) => {
    return (
      <label className="flex items-center space-x-3 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            ref={ref}
            checked={checked}
            onChange={onChange}
            {...props}
          />
          <div
            className={cn(
              "h-5 w-5 rounded-md border-2 transition-all duration-200",
              checked
                ? "bg-white border-white"
                : "border-zinc-600 group-hover:border-zinc-400",
              className
            )}
          >
            {checked && (
              <svg
                className="h-full w-full text-zinc-950 p-0.5"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
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
          <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
            {label}
          </span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
