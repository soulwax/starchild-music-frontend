// File: src/components/ChangelogModal.tsx

"use client";

import { springPresets } from "@/utils/spring-animations";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangelogModal({
  isOpen,
  onClose,
}: ChangelogModalProps) {
  const [changelogContent, setChangelogContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {

      fetch("/CHANGELOG.md")
        .then((res) => res.text())
        .then((text) => {
          setChangelogContent(text);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load changelog:", err);
          setChangelogContent("Failed to load changelog.");
          setLoading(false);
        });
    }
  }, [isOpen]);

  const parseChangelog = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactElement[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      if (line.startsWith("## ")) {
        elements.push(
          <h2
            key={key++}
            className="mb-3 mt-6 text-xl font-bold text-[var(--color-accent)] first:mt-0 md:text-2xl"
          >
            {line.substring(3)}
          </h2>,
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h3
            key={key++}
            className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text)] md:text-xl"
          >
            {line.substring(4)}
          </h3>,
        );
      } else if (line.startsWith("#### ")) {
        elements.push(
          <h4
            key={key++}
            className="mb-2 mt-3 text-base font-semibold text-[var(--color-text)] md:text-lg"
          >
            {line.substring(5)}
          </h4>,
        );
      } else if (line.startsWith("- ")) {

        elements.push(
          <li
            key={key++}
            className="ml-4 text-sm text-[var(--color-subtext)] md:text-base"
          >
            {line.substring(2)}
          </li>,
        );
      } else if (line.startsWith("```")) {

        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i]!.startsWith("```")) {
          codeLines.push(lines[i]!);
          i++;
        }
        elements.push(
          <pre
            key={key++}
            className="my-3 overflow-x-auto rounded-lg bg-[rgba(0,0,0,0.4)] p-3 text-xs md:text-sm"
          >
            <code className="text-[var(--color-accent-light)]">
              {codeLines.join("\n")}
            </code>
          </pre>,
        );
      } else if (line.startsWith("# ")) {

        elements.push(
          <h1
            key={key++}
            className="mb-4 text-2xl font-bold text-[var(--color-text)] md:text-3xl"
          >
            {line.substring(2)}
          </h1>,
        );
      } else if (line.startsWith("**") && line.endsWith("**")) {

        elements.push(
          <p key={key++} className="mb-2 font-semibold text-[var(--color-text)]">
            {line.substring(2, line.length - 2)}
          </p>,
        );
      } else if (line.startsWith("---")) {

        elements.push(
          <hr
            key={key++}
            className="my-6 border-t border-[rgba(255,255,255,0.1)]"
          />,
        );
      } else if (line.trim().length > 0) {

        elements.push(
          <p
            key={key++}
            className="mb-2 text-sm text-[var(--color-subtext)] md:text-base"
          >
            {line}
          </p>,
        );
      }
    }

    return elements;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springPresets.gentle}
            className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springPresets.gentle}
            className="fixed inset-4 z-[91] mx-auto my-auto flex max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-2xl border border-[rgba(244,178,102,0.2)] bg-[rgba(11,17,24,0.98)] shadow-2xl backdrop-blur-xl md:inset-8"
          >
            {}
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] px-5 py-4 md:px-6">
              <h2 className="text-lg font-bold text-[var(--color-text)] md:text-xl">
                Changelog
              </h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(244,178,102,0.1)] text-[var(--color-accent)] transition-all hover:bg-[rgba(244,178,102,0.2)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {}
            <div className="flex-1 overflow-y-auto px-5 py-4 md:px-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="spinner" />
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  {parseChangelog(changelogContent)}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
