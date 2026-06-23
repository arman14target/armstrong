"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CloseIcon, MenuIcon } from "@/components/icons/ActionIcons";
import { CyberButton } from "@/components/ui/CyberButton";
import { IconButton } from "@/components/ui/IconButton";
import { withBasePath } from "@/lib/basePath";
import { cn } from "@/lib/cn";

const navLinks = [
  { href: "/blog/", label: "Blog" },
  { href: "/diet-planner/", label: "Diet Planner" },
  { href: "/gym-planner/", label: "Gym Planner" },
  { href: "/gym-finder/", label: "Gym Finder" },
] as const;

interface NavigationHeaderProps {
  className?: string;
}

export function NavigationHeader({ className }: NavigationHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={cn("nav-header", menuOpen && "nav-header--menu-open", className)}
    >
      <div className="nav-header__bar">
        <Link href="/" className="nav-header__logo" onClick={closeMenu}>
          <Image
            src={withBasePath("/icons/icon-192.png")}
            alt=""
            width={32}
            height={32}
            className="nav-header__logo-icon"
            aria-hidden
          />
          <span className="font-display text-sm tracking-[3px] text-heading uppercase">
            Armstrong
          </span>
        </Link>

        <IconButton
          label={menuOpen ? "Close menu" : "Open menu"}
          variant="ghost"
          className="nav-header__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="nav-header-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <CloseIcon className="size-5" />
          ) : (
            <MenuIcon className="size-5" />
          )}
        </IconButton>

        <nav aria-label="Main navigation" className="nav-header__nav">
          <div className="nav-header__links">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-header__link">
                {link.label}
              </Link>
            ))}
          </div>
          <CyberButton href="/app/" variant="cyan" className="nav-header__cta">
            Open App
          </CyberButton>
        </nav>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="nav-header__backdrop"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <nav
            id="nav-header-mobile-menu"
            aria-label="Mobile navigation"
            className="nav-header__mobile-menu"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-header__mobile-link"
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
            <CyberButton
              href="/app/"
              variant="cyan"
              className="nav-header__mobile-cta"
              onClick={closeMenu}
            >
              Open App
            </CyberButton>
          </nav>
        </>
      ) : null}
    </header>
  );
}
