// File: src/components/MobileNavigation.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { hapticLight, hapticMedium } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  type PanInfo,
} from "framer-motion";
import {
  ChevronUp,
  Home,
  Library,
  ListMusic,
  Music2,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavTab {
  name: string;
  path: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  requiresAuth?: boolean;
}

export default function MobileNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const player = useGlobalPlayer();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const dragY = useMotionValue(0);

  const isActive = (path: string) => {

    if (path === "#now-playing") {
      return player.showMobilePlayer;
    }
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  const tabs: NavTab[] = [
    {
      name: "Home",
      path: "/",
      icon: <Home className="h-5 w-5" strokeWidth={1.5} />,
      activeIcon: <Home className="h-5 w-5" strokeWidth={2.5} />,
    },
    {
      name: "Now Playing",
      path: "#now-playing",
      icon: <Music2 className="h-5 w-5" strokeWidth={1.5} />,
      activeIcon: <Music2 className="h-5 w-5" strokeWidth={2.5} />,
    },
    {
      name: "Library",
      path: "/library",
      icon: <Library className="h-5 w-5" strokeWidth={1.5} />,
      activeIcon: <Library className="h-5 w-5" strokeWidth={2.5} />,
      requiresAuth: true,
    },
    {
      name: "Playlists",
      path: "/playlists",
      icon: <ListMusic className="h-5 w-5" strokeWidth={1.5} />,
      activeIcon: <ListMusic className="h-5 w-5" strokeWidth={2.5} />,
      requiresAuth: true,
    },
    {
      name: session ? "Profile" : "Sign In",
      path: session ? "/profile" : "/api/auth/signin",
      icon: <User className="h-5 w-5" strokeWidth={1.5} />,
      activeIcon: <User className="h-5 w-5" strokeWidth={2.5} />,
    },
  ];

  const visibleTabs = tabs.filter(
    (tab) => {

      if (tab.path === "#now-playing" && !player.currentTrack) return false;

      return !tab.requiresAuth || (tab.requiresAuth && session);
    },
  );

  const activeIndex = visibleTabs.findIndex((tab) => isActive(tab.path));

  const indicatorWidth = 100 / visibleTabs.length;
  const indicatorLeft = activeIndex >= 0 ? activeIndex * indicatorWidth : 0;

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.y < -50 || info.velocity.y < -300) {
      hapticMedium();
      setShowQuickActions(true);
    }
  };

  useEffect(() => {
    setShowQuickActions(false);
  }, [pathname]);

  return (
    <>
      {}
      <AnimatePresence>
        {showQuickActions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm"
              onClick={() => {
                hapticLight();
                setShowQuickActions(false);
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={springPresets.gentle}
              className="pb-safe fixed right-0 bottom-0 left-0 z-[46] rounded-t-3xl border-t border-[rgba(244,178,102,0.16)] bg-[rgba(13,19,28,0.98)] backdrop-blur-xl"
            >
              <div className="flex flex-col items-center pt-4">
                <div className="mb-4 h-1 w-10 rounded-full bg-[rgba(255,255,255,0.2)]" />
                <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">
                  Quick Actions
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 px-6 pb-8">
                {}

                {}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    hapticLight();
                    setShowQuickActions(false);
                  }}
                  className="flex flex-col items-center gap-2 rounded-xl bg-[rgba(140,167,255,0.12)] p-4 transition-colors"
                >
                  <svg
                    className="h-6 w-6 text-[#8ca7ff]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span className="text-xs text-[var(--color-text)]">
                    Search
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={springPresets.gentle}
        style={{ y: dragY }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0 }}
        onDragEnd={handleDragEnd}
        className="safe-bottom fixed right-0 bottom-0 left-0 z-40 md:hidden"
      >
        {}
        <motion.div
          animate={{ opacity: showQuickActions ? 0 : 0.5 }}
          className="absolute top-0 left-1/2 flex -translate-x-1/2 -translate-y-3 items-center justify-center"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronUp className="h-4 w-4 text-[var(--color-muted)]" />
          </motion.div>
        </motion.div>

        {}
        <div className="absolute inset-0 border-t border-[rgba(244,178,102,0.12)] bg-[rgba(8,13,20,0.92)] backdrop-blur-xl" />

        {}
        <div className="relative">
          <motion.div
            layoutId="navIndicator"
            className="absolute top-0 h-[3px] rounded-b-full"
            initial={false}
            animate={{
              left: `${indicatorLeft}%`,
              width: `${indicatorWidth}%`,
            }}
            transition={springPresets.snappy}
            style={{
              background:
                "linear-gradient(90deg, var(--color-accent), var(--color-accent-strong))",
              boxShadow:
                "0 0 12px rgba(244,178,102,0.5), 0 0 24px rgba(244,178,102,0.3)",
            }}
          />
        </div>

        {}
        <div className="relative flex items-stretch justify-around px-2">
          {visibleTabs.map((tab, index) => {
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.path}
                href={tab.path}
                onClick={(e) => {
                  hapticLight();

                  if (tab.path === "#now-playing") {
                    e.preventDefault();
                    player.setShowMobilePlayer(true);
                  }
                }}
                className="touch-target-lg relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
              >
                {}
                <motion.div
                  animate={{
                    scale: active ? 1.15 : 1,
                    y: active ? -3 : 0,
                  }}
                  transition={springPresets.snappy}
                  className={`relative rounded-xl p-1.5 transition-colors ${
                    active
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  {}
                  {active && (
                    <motion.div
                      layoutId={`glow-${index}`}
                      className="absolute inset-0 rounded-xl bg-[rgba(244,178,102,0.15)]"
                      initial={false}
                      transition={springPresets.gentle}
                    />
                  )}
                  <span className="relative z-10">
                    {active ? tab.activeIcon : tab.icon}
                  </span>
                </motion.div>

                {}
                <motion.span
                  animate={{
                    scale: active ? 1 : 0.92,
                    opacity: active ? 1 : 0.6,
                  }}
                  transition={springPresets.snappy}
                  className={`text-[10px] font-semibold tracking-tight ${
                    active
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  {tab.name}
                </motion.span>

                {}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  whileTap={{
                    backgroundColor: "rgba(244, 178, 102, 0.1)",
                    scale: 0.95,
                  }}
                  transition={springPresets.immediate}
                />
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}
