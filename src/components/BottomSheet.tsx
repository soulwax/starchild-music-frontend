// File: src/components/BottomSheet.tsx

"use client";

import { hapticLight, hapticMedium } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[]; // Heights in percentage (e.g., [25, 50, 90])
  initialSnap?: number; // Index of snapPoints
  showHandle?: boolean;
  showCloseButton?: boolean;
  dismissible?: boolean;
  className?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [50, 90],
  initialSnap = 0,
  showHandle = true,
  showCloseButton = true,
  dismissible = true,
  className = "",
}: BottomSheetProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const currentSnapIndex = useRef(initialSnap);

  // Motion values
  const sheetHeight = useMotionValue(snapPoints[initialSnap] ?? 50);
  const y = useMotionValue(0);

  // Transform height to CSS value - must be called unconditionally
  const heightStyle = useTransform(sheetHeight, (h) => `${h}vh`);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Reset to initial snap point when opening
      sheetHeight.set(snapPoints[initialSnap] ?? 50);
      currentSnapIndex.current = initialSnap;
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialSnap, snapPoints, sheetHeight]);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const currentHeight = sheetHeight.get();
    const dragVelocity = info.velocity.y;
    const dragOffset = info.offset.y;

    // Convert drag offset to percentage change
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight : 800;
    const percentageChange = (dragOffset / viewportHeight) * 100;
    const targetHeight = currentHeight - percentageChange;

    // Check for dismiss gesture (fast downward swipe)
    if (
      dismissible &&
      (dragVelocity > 500 || (dragOffset > 100 && targetHeight < 20))
    ) {
      hapticLight();
      onClose();
      return;
    }

    // Find nearest snap point
    let nearestSnap = snapPoints[0] ?? 50;
    let nearestDistance = Infinity;

    snapPoints.forEach((snap, index) => {
      const distance = Math.abs(targetHeight - snap);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestSnap = snap;
        currentSnapIndex.current = index;
      }
    });

    // Apply velocity influence
    if (Math.abs(dragVelocity) > 300) {
      const currentIndex = currentSnapIndex.current;
      if (dragVelocity < 0 && currentIndex < snapPoints.length - 1) {
        // Swiping up - go to next snap point
        nearestSnap = snapPoints[currentIndex + 1] ?? nearestSnap;
        currentSnapIndex.current = currentIndex + 1;
        hapticLight();
      } else if (dragVelocity > 0 && currentIndex > 0) {
        // Swiping down - go to previous snap point
        nearestSnap = snapPoints[currentIndex - 1] ?? nearestSnap;
        currentSnapIndex.current = currentIndex - 1;
        hapticLight();
      }
    }

    sheetHeight.set(nearestSnap);
    y.set(0);
  };

  const handleBackdropClick = () => {
    if (dismissible) {
      hapticLight();
      onClose();
    }
  };

  const handleExpandToMax = () => {
    const maxSnap = snapPoints[snapPoints.length - 1] ?? 90;
    hapticMedium();
    sheetHeight.set(maxSnap);
    currentSnapIndex.current = snapPoints.length - 1;
  };

  const showHeader = Boolean(title) || showCloseButton;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet Container */}
          <div
            ref={constraintsRef}
            className="pointer-events-none fixed inset-x-0 top-0 bottom-0 z-[100]"
          >
            <motion.div
              ref={sheetRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={springPresets.gentle}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.15 }}
              onDragEnd={handleDragEnd}
              style={{
                height: heightStyle,
                y,
              }}
              className={`pointer-events-auto absolute right-0 bottom-0 left-0 flex flex-col overflow-hidden rounded-t-3xl border-t border-[rgba(244,178,102,0.16)] bg-[rgba(13,19,28,0.98)] shadow-[0_-16px_48px_rgba(5,10,18,0.7)] backdrop-blur-xl ${className}`}
            >
              {/* Handle */}
              {showHandle && (
                <div
                  className="flex cursor-grab touch-none flex-col items-center pt-4 pb-2 active:cursor-grabbing"
                  onDoubleClick={handleExpandToMax}
                >
                  <div className="h-1.5 w-12 rounded-full bg-[rgba(255,255,255,0.25)] transition-colors hover:bg-[rgba(255,255,255,0.4)]" />
                </div>
              )}

              {/* Header */}
              {showHeader && (
                <div className="flex items-center justify-between border-b border-[rgba(244,178,102,0.1)] px-6 pt-2 pb-4">
                  {title && (
                    <h2 className="text-xl font-bold text-[var(--color-text)]">
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <motion.button
                      onClick={() => {
                        hapticLight();
                        onClose();
                      }}
                      whileTap={{ scale: 0.9 }}
                      transition={springPresets.immediate}
                      className="touch-target rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:bg-[rgba(244,178,102,0.1)] hover:text-[var(--color-text)]"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="scrollbar-hide pb-safe flex-1 overflow-y-auto overscroll-contain px-6">
                {children}
              </div>

              {/* Snap Point Indicators */}
              {snapPoints.length > 1 && (
                <div className="absolute top-1/2 right-4 flex -translate-y-1/2 flex-col gap-1">
                  {snapPoints.map((snap, index) => (
                    <motion.button
                      key={snap}
                      onClick={() => {
                        hapticLight();
                        sheetHeight.set(snap);
                        currentSnapIndex.current = index;
                      }}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        currentSnapIndex.current === index
                          ? "w-3 bg-[var(--color-accent)]"
                          : "bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.4)]"
                      }`}
                      whileTap={{ scale: 0.8 }}
                      aria-label={`Snap to ${snap}%`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Export a convenience hook for sheet state management
export function useBottomSheet(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  return { isOpen, open, close, toggle, setIsOpen };
}
