// File: src/components/AnimatedList.tsx

"use client";

import { motion } from "framer-motion";
import { listAnimation, listItemAnimation } from "@/utils/spring-animations";
import type { ReactNode } from "react";

export interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function AnimatedList({ children, className = "" }: AnimatedListProps) {
  return (
    <motion.div
      variants={listAnimation}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

export function AnimatedListItem({
  children,
  className = "",
  index,
}: AnimatedListItemProps) {
  return (
    <motion.div
      variants={listItemAnimation}
      custom={index}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedList;
