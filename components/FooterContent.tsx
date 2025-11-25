"use client";

import React from "react";
import Link from "next/link";
import { DiscordLogoIcon, TwitterLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

// Composant helper pour les icônes SVG personnalisées
const IconWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-3.5 h-3.5 md:w-4 md:h-4">{children}</div>
);

const socials = [
  {
    href: "/cgv",
    Icon: () => (
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
    label: "CGV",
  },
  {
    href: "/cgu",
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="18" x2="12" y2="12"></line>
        <line x1="9" y1="15" x2="15" y2="15"></line>
      </svg>
    ),
    label: "CGU",
  },
  {
    href: "https://discord.gg/vPzTuH8Tj",
    Icon: DiscordLogoIcon,
    label: "Discord",
  },
  {
    href: "https://x.com/cantorfi_protocole?t=2trr-LLTAeEC3B8nQo9_mw&s=09",
    Icon: TwitterLogoIcon,
    label: "X",
  },
  {
    href: "https://github.com/cantorfi",
    Icon: GitHubLogoIcon,
    label: "GitHub",
  },
];

export default function FooterContent() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 px-4 text-xs text-muted-foreground">
      
      {/* Copyright (visible desktop, hidden mobile to save space if needed, or keep both) */}
      <div className="hidden md:block font-medium opacity-60">
        © {currentYear} CantorFi Protocol
      </div>

      <div className="flex items-center gap-3 md:gap-4 p-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-md shadow-sm">
        {socials.map(({ href, Icon, label }) => (
          <Link
            key={label}
            href={href}
            target={href.startsWith('http') ? "_blank" : undefined}
            rel={href.startsWith('http') ? "noopener noreferrer" : undefined}
            className={cn(
              "relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full",
              "bg-transparent hover:bg-white/10 border border-transparent hover:border-white/10",
              "text-muted-foreground hover:text-primary hover:scale-110 transition-all duration-300"
            )}
            title={label}
          >
            <IconWrapper>
              <Icon className="w-full h-full" />
            </IconWrapper>
          </Link>
        ))}
      </div>

      {/* Mobile Copyright fallback */}
      <div className="md:hidden text-[10px] opacity-40 mt-1">
        © {currentYear} CantorFi
      </div>
    </div>
  );
}