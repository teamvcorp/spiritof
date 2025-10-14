import React from "react";

// Tailwind v4 polymorphic Container
// - Adjusts to content via max-width presets
// - Provides nice responsive paddings
// - Accepts className and passes through props
// - Polymorphic `as` prop; returns children

type Size = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full" | "prose";
type Padding = "none" | "sm" | "md" | "lg";

type ContainerProps<T extends React.ElementType = "div"> = {
  as?: T;
  children: React.ReactNode;
  className?: string;
  /** Max-width preset */
  size?: Size;
  /** Horizontal padding preset */
  px?: Padding;
  /** Vertical padding preset */
  py?: Padding;
  /** Remove horizontal padding to allow full-bleed content */
  bleed?: boolean;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const sizeToClass: Record<Exclude<Size, "prose">, string> = {
  xs: "max-w-sm",
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-7xl",
  "3xl": "max-w-[96rem]",
  full: "max-w-full",
};

const pxToClass: Record<Padding, string> = {
  none: "px-0",
  sm: "px-4 sm:px-6",
  md: "px-4 sm:px-8",
  lg: "px-6 sm:px-8 lg:px-12",
};

const pyToClass: Record<Padding, string> = {
  none: "py-0",
  sm: "py-4 sm:py-6",
  md: "py-6 sm:py-8",
  lg: "py-8 sm:py-10 lg:py-12",
};

export function Container<T extends React.ElementType = "div">({
  as,
  children,
  className,
  size = "2xl",
  px = "md",
  py = "none",
  bleed = false,
  ...rest
}: ContainerProps<T>) {
  const Comp = as ?? "div";
  const maxW = size === "prose" ? "max-w-prose" : sizeToClass[size];
  const paddingX = bleed ? "px-2" : pxToClass[px];
  

  return (
    <Comp
      data-container=""
      className={cn(
        "mx-auto w-full py-10",
        maxW,
        paddingX,
        
        "transition-[padding]",
        className
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export default Container;
