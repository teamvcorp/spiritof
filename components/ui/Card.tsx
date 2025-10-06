import React from "react";

// Responsive Card system for Tailwind v4 (no styled-jsx)
// - <Cards> is a flex row that auto spaces and wraps
// - Each <Card> grows up to 50% when there are multiple siblings
// - A single <Card> expands to 100% (via :only-child arbitrary variant)
// - Accepts className on both wrappers; Cards also accepts a gap preset



type Gap = "sm" | "md" | "lg" | "xl";

type CardsProps = React.HTMLAttributes<HTMLDivElement> & {
  gap?: Gap;
};

type CardProps<T extends React.ElementType = "div"> = {
  as?: T;
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

const gapClass: Record<Gap, string> = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

export function Cards({ className, gap = "lg", children, ...rest }: CardsProps) {
  return (
    <div className={cn("flex flex-wrap justify-between", gapClass[gap], className)} {...rest}>
      {children}
    </div>
  );
}

export function Card<T extends React.ElementType = "div">({
  as,
  className,
  interactive = false,
  children,
  ...rest
}: CardProps<T>) {
  const Comp = as ?? "div";
  return (
    <Comp
      className={cn(
        "sos-card rounded-2xl  bg-surface p-5 ",
        // layout behavior
        "flex-1 basis-[28rem] max-w-full",
        // when this card is the only child of its parent, take full width
        "[&:only-child]:max-w-full",
        interactive && "transition hover:shadow-md hover:-translate-y-0.5",
        className
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export default Card;
