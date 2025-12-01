"use client";

import React from "react";
import Link from "next/link";
import { DiscordLogoIcon, TwitterLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";

const socials = [
  {
    href: "https://discord.gg/vPzTuH8Tj",
    Icon: DiscordLogoIcon,
    label: "Discord",
  },
  {
    href: "https://x.com/cantorfi_protocole",
    Icon: TwitterLogoIcon,
    label: "X",
  },
  {
    href: "https://github.com/cantorfi",
    Icon: GitHubLogoIcon,
    label: "GitHub",
  },
];

const legalLinks = [
  { href: "/cgv", label: "CGV" },
  { href: "/cgu", label: "CGU" },
];

export default function FooterContent() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="container-app flex flex-col sm:flex-row items-center justify-between gap-2 py-1">
      {/* Copyright */}
      <div className="text-xs text-muted-foreground order-2 sm:order-1">
        <span className="hidden sm:inline">© {currentYear} CantorFi Protocol</span>
        <span className="sm:hidden">© {currentYear} CantorFi</span>
      </div>

      {/* Center: Social Links */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {socials.map(({ href, Icon, label }) => (
          <Link
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-all"
            title={label}
          >
            <Icon className="w-4 h-4" />
          </Link>
        ))}
      </div>

      {/* Right: Legal Links */}
      <div className="flex items-center gap-3 text-xs order-3">
        {legalLinks.map(({ href, label }) => (
          <Link
            key={label}
            href={href}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
