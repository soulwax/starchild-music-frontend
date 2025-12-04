// File: src/utils/spring-animations.ts

/**
 * Spring animation presets for consistent, snappy mobile interactions
 */

export const springPresets = {
  // Ultra-snappy for buttons and small interactions
  snappy: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 0.5,
  },

  // Smooth and natural for cards and larger elements
  smooth: {
    type: "spring" as const,
    stiffness: 300,
    damping: 35,
    mass: 0.8,
  },

  // Bouncy for playful interactions
  bouncy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25,
    mass: 0.6,
  },

  // Gentle for sheets and panels
  gentle: {
    type: "spring" as const,
    stiffness: 200,
    damping: 30,
    mass: 1,
  },

  // Immediate for touch feedback
  immediate: {
    type: "spring" as const,
    stiffness: 700,
    damping: 40,
    mass: 0.3,
  },

  // Elastic for swipe actions
  elastic: {
    type: "spring" as const,
    stiffness: 350,
    damping: 20,
    mass: 0.7,
  },
};

export const easePresets = {
  // Smooth ease out for exits
  easeOut: [0.4, 0, 0.2, 1],

  // Quick ease in for entrances
  easeIn: [0.4, 0, 1, 1],

  // Symmetric for bidirectional animations
  easeInOut: [0.4, 0, 0.2, 1],

  // Sharp for snappy interactions
  sharp: [0.4, 0, 0.6, 1],

  // Emphasized for important actions
  emphasized: [0.0, 0, 0.2, 1],
};

export const tapAnimation = {
  scale: 0.95,
  transition: springPresets.immediate,
};

export const hoverAnimation = {
  scale: 1.02,
  y: -2,
  transition: springPresets.snappy,
};

export const pressAnimation = {
  scale: 0.98,
  transition: springPresets.immediate,
};

export const slideUpAnimation = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0 },
  transition: springPresets.gentle,
};

export const slideDownAnimation = {
  initial: { y: "-100%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: "-100%", opacity: 0 },
  transition: springPresets.gentle,
};

export const fadeAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const scaleAnimation = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
  transition: springPresets.smooth,
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: springPresets.smooth,
};

export const listAnimation = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const listItemAnimation = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: springPresets.smooth,
  },
};
