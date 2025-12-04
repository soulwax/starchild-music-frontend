// File: src/components/FloatingActionButton.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useMobilePanes } from "@/contexts/MobilePanesContext";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { hapticLight, hapticMedium, hapticSuccess } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { ListMusic, Music2, Plus, Search, Shuffle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  action: () => void;
}

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();
  const player = useGlobalPlayer();
  const { navigateToPane, currentPane } = useMobilePanes();

  const rotation = useMotionValue(0);
  const scale = useTransform(rotation, [0, 45], [1, 1.1]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    rotation.set(isOpen ? 45 : 0);
  }, [isOpen, rotation]);

  // Don't render on desktop
  if (!mounted || !isMobile) return null;

  // Don't show when player pane is active (pane 0)
  if (currentPane === 0 || currentPane === 1) return null;

  const quickActions: QuickAction[] = [
    {
      id: "search",
      label: "Search",
      icon: <Search className="h-5 w-5" />,
      color: "text-[#8ca7ff]",
      bgColor: "bg-[rgba(140,167,255,0.2)]",
      action: () => {
        hapticLight();
        router.push("/");
        setIsOpen(false);
      },
    },
    {
      id: "queue",
      label: "Queue",
      icon: <ListMusic className="h-5 w-5" />,
      color: "text-[var(--color-accent-strong)]",
      bgColor: "bg-[rgba(88,198,177,0.2)]",
      action: () => {
        hapticLight();
        navigateToPane(1);
        setIsOpen(false);
      },
    },
    {
      id: "now-playing",
      label: "Playing",
      icon: <Music2 className="h-5 w-5" />,
      color: "text-[var(--color-accent)]",
      bgColor: "bg-[rgba(244,178,102,0.2)]",
      action: () => {
        hapticLight();
        if (player.currentTrack) {
          navigateToPane(0);
        }
        setIsOpen(false);
      },
    },
    {
      id: "shuffle",
      label: "Shuffle",
      icon: <Shuffle className="h-5 w-5" />,
      color: "text-[var(--color-warning)]",
      bgColor: "bg-[rgba(242,199,97,0.2)]",
      action: () => {
        hapticSuccess();
        player.toggleShuffle();
        setIsOpen(false);
      },
    },
  ];

  // Filter actions based on state
  const visibleActions = quickActions.filter((action) => {
    if (action.id === "now-playing" && !player.currentTrack) return false;
    return true;
  });

  const handleToggle = () => {
    hapticMedium();
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm"
            onClick={() => {
              hapticLight();
              setIsOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Quick Action Buttons */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed right-4 bottom-36 z-[56] flex flex-col-reverse items-end gap-3">
            {visibleActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.6, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.6, x: 20 }}
                transition={{
                  ...springPresets.bouncy,
                  delay: index * 0.05,
                }}
                className="flex items-center gap-3"
              >
                {/* Label */}
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                  className="rounded-lg bg-[rgba(10,16,24,0.95)] px-3 py-1.5 text-sm font-medium text-[var(--color-text)] shadow-lg backdrop-blur-md"
                >
                  {action.label}
                </motion.span>

                {/* Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={action.action}
                  className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg ${action.bgColor} ${action.color} ring-1 ring-white/10 backdrop-blur-md`}
                >
                  {action.icon}
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        style={{ scale }}
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
        className={`fixed right-4 bottom-36 z-[57] flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-colors ${
          isOpen
            ? "bg-[var(--color-surface)] ring-1 ring-white/20"
            : "bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-strong)]"
        }`}
        animate={{
          rotate: isOpen ? 45 : 0,
          boxShadow: isOpen
            ? "0 8px 24px rgba(0, 0, 0, 0.3)"
            : "0 12px 32px rgba(244, 178, 102, 0.4), 0 0 20px rgba(244, 178, 102, 0.2)",
        }}
        transition={springPresets.snappy}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={springPresets.immediate}
            >
              <X className="h-6 w-6 text-[var(--color-text)]" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={springPresets.immediate}
            >
              <Plus className="h-6 w-6 text-[#0f141d]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Active Track Indicator - when playing */}
      {player.isPlaying && !isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="pointer-events-none fixed right-4 bottom-36 z-[54]"
        >
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-[var(--color-accent)]"
          />
        </motion.div>
      )}
    </>
  );
}
