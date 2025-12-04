// File: src/components/Header.tsx

"use client";

import { LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch current user's profile info to get their userHash
  const { data: userProfile } = api.music.getCurrentUserProfile.useQuery(
    undefined,
    {
      enabled: !!session,
    },
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu]);

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[rgba(244,178,102,0.12)] bg-[rgba(10,16,24,0.88)] shadow-lg shadow-[rgba(5,10,18,0.6)] backdrop-blur-xl">
        <div className="container flex items-center justify-between py-3.5">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <Image
              src="/AppIcons/Assets.xcassets/AppIcon.appiconset/48.png"
              alt="Starchild Music"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl shadow-lg ring-2 ring-[rgba(244,178,102,0.3)] transition-all group-hover:scale-105 group-hover:shadow-[rgba(244,178,102,0.35)]"
              priority
            />
            <span className="accent-gradient hidden text-lg font-bold md:block">
              Starchild Music
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--color-subtext)] transition-all hover:scale-105 hover:text-[var(--color-text)]"
            >
              Home
            </Link>
            {session && (
              <>
                <Link
                  href="/library"
                  className="text-sm font-medium text-[var(--color-subtext)] transition-all hover:scale-105 hover:text-[var(--color-text)]"
                >
                  Library
                </Link>
                <Link
                  href="/playlists"
                  className="text-sm font-medium text-[var(--color-subtext)] transition-all hover:scale-105 hover:text-[var(--color-text)]"
                >
                  Playlists
                </Link>
              </>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* User Profile Dropdown (Desktop) */}
            {session ? (
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="btn-secondary flex items-center gap-2 transition-all hover:scale-105"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user?.name ?? "User"}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(244,178,102,0.4),rgba(88,198,177,0.4))] text-xs font-bold text-[var(--color-text)] shadow-lg shadow-[rgba(244,178,102,0.3)]">
                      {session.user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </div>
                  )}
                  <span className="text-sm">{session.user?.name}</span>
                  <svg
                    className={`h-4 w-4 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 mt-2 w-52 rounded-xl border border-[rgba(244,178,102,0.16)] bg-[rgba(18,26,38,0.95)] p-1 shadow-xl shadow-[rgba(5,10,18,0.6)] backdrop-blur-lg duration-200">
                    <div className="space-y-1">
                      {userProfile?.userHash && (
                        <Link
                          href={`/${userProfile.userHash}`}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-subtext)] transition-colors hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)]"
                        >
                          <User className="h-4 w-4" />
                          My Profile
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-subtext)] transition-colors hover:bg-[rgba(242,139,130,0.12)] hover:text-[var(--color-text)]"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/api/auth/signin" className="hidden md:block">
                <button className="btn-primary transition-all hover:scale-105">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
