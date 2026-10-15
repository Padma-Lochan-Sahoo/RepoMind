import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type RepoMindIconProps = SVGProps<SVGSVGElement> & {
  variant?: "color" | "mono";
};

export function RepoMindIcon({
  className,
  variant = "color",
  ...props
}: RepoMindIconProps) {
  const mono = variant === "mono";

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      {/* Outer repository / brain structure */}
      <rect
        x="8"
        y="8"
        width="48"
        height="48"
        rx="14"
        fill={mono ? "currentColor" : "#0F172A"}
      />

      {/* Repository branches */}
      <path
        d="M23 19V25M41 19V25M23 39V45M41 39V45"
        stroke={mono ? "#FFFFFF" : "#38BDF8"}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Central RepoMind nodes */}
      <circle
        cx="23"
        cy="17"
        r="4"
        fill={mono ? "#FFFFFF" : "#38BDF8"}
      />
      <circle
        cx="41"
        cy="17"
        r="4"
        fill={mono ? "#FFFFFF" : "#A78BFA"}
      />

      <circle
        cx="23"
        cy="47"
        r="4"
        fill={mono ? "#FFFFFF" : "#A78BFA"}
      />
      <circle
        cx="41"
        cy="47"
        r="4"
        fill={mono ? "#FFFFFF" : "#38BDF8"}
      />

      {/* Central AI / knowledge symbol */}
      <path
        d="M23 27H41V37H23V27Z"
        fill={mono ? "#FFFFFF" : "#F8FAFC"}
        fillOpacity={mono ? 1 : 0.12}
        stroke={mono ? "#FFFFFF" : "#38BDF8"}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      <path
        d="M28 32H36M32 28V36"
        stroke={mono ? "#0F172A" : "#38BDF8"}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
