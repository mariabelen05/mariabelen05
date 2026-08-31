"use client";

import { motion } from "motion/react";
import { Children, isValidElement, type ReactNode } from "react";

import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface OnboardingProps {
  step: number;
  labels: string[];
  children: ReactNode;
  className?: string;
}

export function Onboarding({ step, labels, children, className }: OnboardingProps) {
  const steps = Children.toArray(children).filter(isValidElement);

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <OnboardingIndicator step={step} labels={labels} />
      <div className="overflow-hidden">
        <motion.div
          className="flex"
          animate={{ x: `-${step * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
        >
          {steps.map((child, i) => (
            <div key={i} className="w-full shrink-0 px-0.5">
              {child}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function OnboardingIndicator({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-start">
      {labels.map((label, i) => (
        <div key={label} className={cn("flex items-center", i < labels.length - 1 && "flex-1")}>
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              animate={{
                backgroundColor: i <= step ? "var(--color-primary)" : "var(--color-border)",
                color: i <= step ? "#ffffff" : "var(--color-text-faint)",
              }}
              transition={{ duration: 0.25 }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            >
              {i < step ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
            </motion.div>
            <span
              className={cn(
                "w-20 text-center text-[11px] font-semibold",
                i === step ? "text-primary" : "text-text-faint",
              )}
            >
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div className="mx-1.5 mt-3.5 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full bg-primary"
                initial={false}
                animate={{ width: i < step ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
