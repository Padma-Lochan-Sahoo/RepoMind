"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const NODES = [
  { x: 18, y: 22, label: "auth" },
  { x: 42, y: 14, label: "api" },
  { x: 68, y: 24, label: "db" },
  { x: 28, y: 48, label: "hooks" },
  { x: 55, y: 52, label: "ui" },
  { x: 78, y: 46, label: "ci" },
  { x: 38, y: 76, label: "tests" },
  { x: 62, y: 78, label: "docs" },
] as const;

const LINKS: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 3],
  [1, 4],
  [2, 5],
  [3, 6],
  [4, 7],
  [4, 5],
  [3, 4],
];

export function HeroCanvas({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [active, setActive] = React.useState(4);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % NODES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 12;
      setOffset({ x, y });
    };

    node.addEventListener("pointermove", onMove);
    return () => node.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 overflow-hidden select-none",
        className
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-aurora" />

      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklch, var(--foreground) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 8%, transparent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at 60% 40%, black 20%, transparent 70%)",
          transform: `translate3d(${offset.x * 0.15}px, ${offset.y * 0.15}px, 0)`,
        }}
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          transition: "transform 120ms ease-out",
        }}
      >
        {LINKS.map(([from, to]) => {
          const a = NODES[from];
          const b = NODES[to];
          const lit = from === active || to === active;
          return (
            <line
              key={`${from}-${to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              className={cn(
                "text-foreground/20 transition-[stroke,opacity] duration-500",
                lit && "text-primary/80"
              )}
              strokeWidth={lit ? 0.45 : 0.28}
            />
          );
        })}

        {NODES.map((node, index) => {
          const isActive = index === active;
          return (
            <g key={node.label}>
              <circle
                cx={node.x}
                cy={node.y}
                r={isActive ? 2.8 : 2.1}
                className={cn(
                  "fill-background stroke-foreground/30 transition-all duration-500",
                  isActive &&
                    "fill-primary/20 stroke-primary"
                )}
                strokeWidth={0.35}
              />
              <text
                x={node.x}
                y={node.y + 5.2}
                textAnchor="middle"
                className={cn(
                  "fill-foreground/45 font-mono text-[2.2px] tracking-wide transition-opacity duration-500",
                  isActive && "fill-foreground/80"
                )}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
