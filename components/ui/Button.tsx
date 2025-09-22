// components/ui/Button.tsx
"use client";

import React from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type ButtonProps = {
  children?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  /**
   * Accept sync or async handlers:
   * (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>
   */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "className" | "disabled" | "type">;

export default function Button({
  children,
  leftIcon,
  rightIcon,
  loading = false,
  className,
  onClick,
  type = "button",
  disabled = false,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={cn(
        "inline-flex max-w-60 items-center gap-2  rounded-xl px-4 py-4 text-lg justify-center transform transition-transform duration-300 ease-in-out hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-60 disabled:pointer-events-none",
        className
      )}
      onClick={(e) => {
        if (!onClick) return;
        // allow async handlers
        void onClick(e);
      }}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        <>
          {leftIcon ? <span className={children ? "mr-2" : ""}>{leftIcon}</span> : null}
          {children}
          {rightIcon ? <span className={children ? "ml-2" : ""}>{rightIcon}</span> : null}
        </>
      )}
    </button>
  );
}
