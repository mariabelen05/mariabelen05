"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useMemo, type JSX } from "react";

import { cn } from "@/lib/utils";

type AnimationType = "fadeIn" | "blurIn" | "blurInUp" | "slideUp" | "slideLeft" | "scaleUp";
type AnimationVariant = "text" | "word" | "character" | "line";

interface TextAnimateProps {
  children: string;
  className?: string;
  segmentClassName?: string;
  delay?: number;
  duration?: number;
  as?: keyof JSX.IntrinsicElements;
  by?: AnimationVariant;
  animation?: AnimationType;
  once?: boolean;
}

const staggerTimings: Record<AnimationVariant, number> = {
  text: 0.06,
  word: 0.05,
  character: 0.02,
  line: 0.1,
};

const defaultContainerVariants: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.02, staggerDirection: -1 },
  },
};

const animationVariants: Record<AnimationType, Variants> = {
  fadeIn: {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  blurIn: {
    hidden: { opacity: 0, filter: "blur(8px)" },
    show: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(8px)" },
  },
  blurInUp: {
    hidden: { opacity: 0, filter: "blur(8px)", y: 16 },
    show: { opacity: 1, filter: "blur(0px)", y: 0 },
    exit: { opacity: 0, filter: "blur(8px)", y: -16 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.5 },
    show: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.5 },
  },
};

function splitText(text: string, by: AnimationVariant) {
  switch (by) {
    case "character":
      return text.split("");
    case "word":
      return text.split(/(\s+)/);
    case "line":
      return text.split("\n");
    default:
      return [text];
  }
}

export function TextAnimate({
  children,
  className,
  segmentClassName,
  delay = 0,
  duration = 0.4,
  as = "p",
  by = "word",
  animation = "fadeIn",
  once = true,
}: TextAnimateProps) {
  const MotionTag = useMemo(() => motion.create(as as "p"), [as]);
  const segments = useMemo(() => splitText(children, by), [children, by]);
  const stagger = staggerTimings[by];
  const segmentVariants = animationVariants[animation];

  const containerVariants: Variants = {
    ...defaultContainerVariants,
    show: {
      ...defaultContainerVariants.show,
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };

  return (
    <AnimatePresence mode="popLayout">
      <MotionTag
        className={cn("whitespace-pre-wrap", className)}
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        exit="exit"
        viewport={{ once }}
      >
        {segments.map((segment, i) => (
          <motion.span
            key={`${by}-${i}-${segment}`}
            variants={segmentVariants}
            transition={{ duration, ease: "easeOut" }}
            className={cn(
              by === "character" ? "inline-block" : "inline-block whitespace-pre",
              segmentClassName,
            )}
          >
            {segment}
          </motion.span>
        ))}
      </MotionTag>
    </AnimatePresence>
  );
}
