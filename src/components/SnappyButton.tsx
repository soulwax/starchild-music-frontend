// File: src/components/SnappyButton.tsx

"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { hapticLight, hapticMedium } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import type { ReactNode } from "react";

export interface SnappyButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  haptic?: "light" | "medium" | "none";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export function SnappyButton({
  children,
  variant = "primary",
  size = "md",
  haptic = "light",
  icon,
  iconPosition = "left",
  fullWidth = false,
  onClick,
  className = "",
  disabled,
  ...props
}: SnappyButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (haptic === "light") hapticLight();
    else if (haptic === "medium") hapticMedium();

    onClick?.(e);
  };

  const baseClass =
    "relative overflow-hidden font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm rounded-lg min-h-[36px]",
    md: "px-4 py-2 text-base rounded-lg min-h-[44px] touch-target",
    lg: "px-6 py-3 text-lg rounded-xl min-h-[48px] touch-target-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={springPresets.snappy}
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {icon && iconPosition === "left" && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </span>
    </motion.button>
  );
}

export default SnappyButton;
