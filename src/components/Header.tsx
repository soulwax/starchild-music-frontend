// File: src/components/Header.tsx

"use client";

import { LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { env } from "@/env";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [isVercelDeployment, setIsVercelDeployment] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: userProfile } = api.music.getCurrentUserProfile.useQuery(
    undefined,
    {
      enabled: !!session,
    },
  );

  useEffect(() => {
    setIsElectron(!!window.electron?.isElectron);
    setIsVercelDeployment(
      typeof window !== "undefined" &&
        window.location.hostname.endsWith("vercel.app"),
    );
  }, []);

  useEffect(() => {
    if (session?.user?.image) {
      setImageError(false);
    }
  }, [session?.user?.image]);

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

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // If already on home page, clear search and scroll to top
    if (pathname === "/") {
      router.push("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Navigate to home page
      router.push("/");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[rgba(244,178,102,0.12)] bg-[rgba(10,16,24,0.88)] shadow-lg shadow-[rgba(5,10,18,0.6)] backdrop-blur-xl">
        <div className="container flex items-center justify-between py-3.5">
          {}
          <Link
            href="/"
            onClick={handleLogoClick}
            className="group flex items-center gap-3"
          >
            <Image
              src="/AppIcons/Assets.xcassets/AppIcon.appiconset/48.png"
              alt="darkfloor.art"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl shadow-lg ring-2 ring-[rgba(244,178,102,0.3)] transition-all group-hover:scale-105 group-hover:shadow-[rgba(244,178,102,0.35)]"
              priority
            />
            <span className="accent-gradient hidden text-lg font-bold md:block">
              {isElectron ? "Starchild" : "darkfloor.art"}
            </span>
          </Link>

          {}
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

          {}
          <div className="flex items-center gap-3">
            {}
            {isVercelDeployment && env.NEXT_PUBLIC_NEXTAUTH_URL_CUSTOM_SERVER ? (
              <Link
                href={env.NEXT_PUBLIC_NEXTAUTH_URL_CUSTOM_SERVER}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center transition-opacity hover:opacity-80"
                aria-label="View on custom server"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[var(--color-text)]"
                >
                  <path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 12L12 17L22 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ) : env.NEXT_PUBLIC_NEXTAUTH_VERCEL_URL ? (
              <Link
                href={env.NEXT_PUBLIC_NEXTAUTH_VERCEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 transition-colors text-[var(--color-subtext)] hover:text-[var(--color-text)]"
                aria-label="View on Vercel"
              >
                <span className="text-xs font-medium">&gt;Vercel</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 76 65"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="opacity-60"
                >
                  <path
                    d="M37.5274 0L75.0548 65H0L37.5274 0Z"
                    fill="currentColor"
                  />
                </svg>
              </Link>
            ) : null}
            {}
            {session ? (
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="btn-secondary flex items-center gap-2 transition-all hover:scale-105"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  {session.user?.image && !imageError ? (
                    <Image
                      src={session.user.image}
                      alt={session.user?.name ?? "User"}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full ring-2 ring-white/10"
                      onError={() => setImageError(true)}
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

                {}
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
