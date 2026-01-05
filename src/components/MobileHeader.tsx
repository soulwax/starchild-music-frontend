// File: src/components/MobileHeader.tsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import MobileSearchBar from "@/components/MobileSearchBar";
import { useMenu } from "@/contexts/MenuContext";
import { hapticMedium } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useRouter } from "next/navigation";

export default function MobileHeader() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { isMenuOpen, toggleMenu } = useMenu();
  const [searchQuery, setSearchQuery] = useState("");

  if (!isMobile) return null;

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={springPresets.gentle}
      className="safe-top fixed left-0 right-0 top-0 z-50
                 border-b border-[rgba(244,178,102,0.12)]
                 bg-[rgba(10,16,24,0.95)]
                 shadow-lg
                 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {}
        <motion.button
          onClick={() => {
            hapticMedium();
            toggleMenu();
          }}
          whileTap={{ scale: 0.9 }}
          className="touch-target flex-shrink-0 rounded-lg p-2
                     text-[var(--color-text)]
                     transition
                     hover:bg-[rgba(244,178,102,0.1)]"
          aria-label="Menu"
        >
          <AnimatePresence mode="wait">
            {isMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={springPresets.snappy}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={springPresets.snappy}
              >
                <Menu className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {}
        <div className="flex-1">
          <MobileSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Search music..."
          />
        </div>
      </div>
    </motion.header>
  );
}
