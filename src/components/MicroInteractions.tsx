// File: src/components/MicroInteractions.tsx

"use client";

import { motion } from "framer-motion";
import { springPresets } from "@/utils/spring-animations";
import { hapticLight, hapticMedium } from "@/utils/haptics";
import type { ReactNode } from "react";

/**
 * Bouncy icon button with haptic feedback
 */
export interface BouncyIconButtonProps {
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  haptic?: "light" | "medium";
}

export function BouncyIconButton({
  icon,
  onClick,
  active = false,
  disabled = false,
  className = "",
  haptic = "light",
}: BouncyIconButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    if (haptic === "light") hapticLight();
    else hapticMedium();
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      animate={{
        scale: active ? 1.1 : 1,
      }}
      transition={springPresets.bouncy}
      className={`touch-target rounded-full p-2 transition-colors ${
        active ? "text-[var(--color-accent)]" : "text-[var(--color-subtext)]"
      } ${disabled ? "cursor-not-allowed opacity-50" : "hover:text-[var(--color-text)]"} ${className}`}
    >
      {icon}
    </motion.button>
  );
}

/**
 * Ripple effect button
 */
export interface RippleButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  variant?: "primary" | "secondary";
}

export function RippleButton({
  children,
  onClick,
  className = "",
  variant = "primary",
}: RippleButtonProps) {
  const handleClick = () => {
    hapticMedium();
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      transition={springPresets.snappy}
      className={`relative overflow-hidden ${
        variant === "primary" ? "btn-primary" : "btn-secondary"
      } ${className}`}
    >
      <motion.span
        className="relative z-10"
        initial={{ scale: 1 }}
        whileTap={{ scale: 0.98 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
}

/**
 * Floating action button with pulse effect
 */
export interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick: () => void;
  className?: string;
  pulse?: boolean;
}

export function FloatingActionButton({
  icon,
  onClick,
  className = "",
  pulse = false,
}: FloatingActionButtonProps) {
  const handleClick = () => {
    hapticMedium();
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05, rotate: 5 }}
      animate={pulse ? { scale: [1, 1.05, 1] } : {}}
      transition={
        pulse
          ? { repeat: Infinity, duration: 2, ease: "easeInOut" }
          : springPresets.snappy
      }
      className={`fixed right-4 bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] text-[#0f141d] shadow-[0_8px_24px_rgba(244,178,102,0.4)] md:hidden ${className}`}
    >
      {icon}
    </motion.button>
  );
}

/**
 * Animated checkbox with spring physics
 */
export interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function AnimatedCheckbox({
  checked,
  onChange,
  label,
}: AnimatedCheckboxProps) {
  const handleChange = () => {
    hapticLight();
    onChange(!checked);
  };

  return (
    <motion.label
      className="flex cursor-pointer items-center gap-2"
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className={`relative h-6 w-6 rounded-md border-2 transition-colors ${
          checked
            ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
            : "border-[var(--color-border)] bg-transparent"
        }`}
        onClick={handleChange}
        whileHover={{ scale: 1.1 }}
        transition={springPresets.snappy}
      >
        {checked && (
          <motion.svg
            className="absolute inset-0 m-auto h-4 w-4 text-[#0f141d]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={springPresets.bouncy}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </motion.svg>
        )}
      </motion.div>
      {label && (
        <span className="text-sm text-[var(--color-text)]">{label}</span>
      )}
    </motion.label>
  );
}

/**
 * Progress indicator with smooth animation
 */
export interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
}

export function AnimatedProgress({
  value,
  max = 100,
  className = "",
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div
      className={`relative h-2 overflow-hidden rounded-full bg-[var(--color-surface)] ${className}`}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)]"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={springPresets.smooth}
      />
    </div>
  );
}

/**
 * Pulse notification badge
 */
export interface PulseBadgeProps {
  count: number;
  className?: string;
}

export function PulseBadge({ count, className = "" }: PulseBadgeProps) {
  if (count <= 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={springPresets.bouncy}
      className={`flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white ${className}`}
    >
      <motion.span
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {count > 99 ? "99+" : count}
      </motion.span>
    </motion.div>
  );
}
