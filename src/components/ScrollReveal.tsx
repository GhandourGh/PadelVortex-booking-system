"use client";

import React, { CSSProperties, ReactElement, ReactNode, useEffect, useRef, useState } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Delay before animation starts (ms) */
  delayMs?: number;
  /** Animation duration (ms) */
  durationMs?: number;
  /** Initial translateY distance in pixels */
  offsetY?: number;
  /** Intersection ratio to trigger (0-1) */
  amount?: number;
  /** Stagger each direct child by this many ms. If 0, animate wrapper instead. */
  staggerChildrenMs?: number;
  /** Run animation only once when first revealed */
  once?: boolean;
};

/**
 * ScrollReveal
 * - Lightweight IntersectionObserver-based reveal with fade + subtle upward motion
 * - Respects prefers-reduced-motion
 * - Optional per-child staggering
 * - Runs once by default
 */
export default function ScrollReveal({
  children,
  className,
  style,
  delayMs = 0,
  durationMs = 600,
  offsetY = 12,
  amount = 0.15,
  staggerChildrenMs = 60,
  once = true,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const reduceMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setIsVisible(true);
      setHasShown(true);
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) setHasShown(true);
            if (once) observer.unobserve(entry.target);
          }
        });
      },
      { threshold: amount, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [amount, once]);

  const effectiveVisible = isVisible || (once && hasShown);

  const baseTransition = `opacity ${durationMs}ms cubic-bezier(.2,.6,.2,1) ${delayMs}ms, transform ${durationMs}ms cubic-bezier(.2,.6,.2,1) ${delayMs}ms`;
  const hiddenStyle: CSSProperties = {
    opacity: 0,
    transform: `translateY(${offsetY}px)`,
    willChange: "opacity, transform",
  };
  const shownStyle: CSSProperties = {
    opacity: 1,
    transform: "none",
  };

  // If stagger is requested, animate each direct child and keep wrapper static.
  const shouldStagger = staggerChildrenMs > 0;

  const content = shouldStagger
    ? React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        const childStyle: CSSProperties = {
          transition: baseTransition.replace(`${delayMs}ms`, `${delayMs + index * staggerChildrenMs}ms`),
          ...(effectiveVisible ? shownStyle : hiddenStyle),
          // Avoid overriding child styles
          ...(child.props?.style || {}),
        };
        return React.cloneElement(child as ReactElement<any>, {
          style: childStyle,
        });
      })
    : children;

  const wrapperStyle: CSSProperties = shouldStagger
    ? // wrapper stays neutral when staggering children
      { ...style }
    : {
        transition: baseTransition,
        ...(effectiveVisible ? shownStyle : hiddenStyle),
        ...style,
      };

  return (
    <div ref={containerRef} className={className} style={wrapperStyle}>
      {content}
    </div>
  );
}


