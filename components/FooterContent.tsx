"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "@/components/providers/IntlProvider";
import { DiscordLogoIcon, TwitterLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

const socials = [
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
  const footerT = useTranslations("footer");

  return (
    <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4 text-xs lg:text-sm text-muted-foreground">
      <span className="lg:flex-1 lg:min-w-0 text-center lg:text-left">{footerT("copyright")}</span>

      <div className="lg:flex-1 lg:min-w-0 flex flex-wrap items-center justify-center gap-2 lg:gap-3 text-xs">
        <Link href="/cgv" className="hover:text-foreground transition-colors whitespace-nowrap">
          {footerT("cgv")}
        </Link>
        <span aria-hidden="true">•</span>
        <Link href="/cgu" className="hover:text-foreground transition-colors whitespace-nowrap">
          {footerT("cgu")}
        </Link>
        <span aria-hidden="true" className="hidden lg:inline">•</span>
        <a
          href={`mailto:${footerT("contactEmail")}`}
          className="hover:text-foreground transition-colors hidden lg:inline"
        >
          {footerT("contactLabel")}: {footerT("contactEmail")}
        </a>
      </div>

      <div className="lg:flex-1 lg:min-w-0 flex items-center justify-center lg:justify-end gap-2 lg:gap-3">
        {socials.map(({ href, Icon, label }) => (
          <Link
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className={cn(
              "h-8 w-8 lg:h-9 lg:w-9 rounded-full border border-white/10 flex items-center justify-center",
              "hover:bg-white/10 hover:text-foreground transition-colors"
            )}
          >
            <Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          </Link>
        ))}
      </div>
    </div>
  );
}
