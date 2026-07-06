"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Anim = "up" | "left" | "right" | "zoom";

/** Revela o conteúdo com animação quando entra na viewport. */
export default function Reveal({
  children,
  anim = "up",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  anim?: Anim;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("revealed");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      data-anim={anim}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
