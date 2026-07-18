import type { ElementType, ReactNode } from "react";

type AnimatedHeadingProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
};

export function AnimatedHeading({ as: Tag = "h2", children, className = "" }: AnimatedHeadingProps) {
  return (
    <Tag className={`display-heading velocity-heading ${className}`} data-velocity-heading>
      {children}
    </Tag>
  );
}
