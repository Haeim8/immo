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
    href: "https://x.com/usci_protocole?t=2trr-LLTAeEC3B8nQo9_mw&s=09",
    Icon: TwitterLogoIcon,
    label: "X",
  },
  {
    href: "https://github.com/joyco-studio",
    Icon: GitHubLogoIcon,
    label: "GitHub",
  },
];

export default function FooterContent() {
  const footerT = useTranslations("footer");

  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
      <span className="flex-1 min-w-[200px]">{footerT("copyright")}</span>

      <div className="flex-1 min-w-[220px] flex flex-wrap items-center justify-center gap-3">
        <Link href="/cgv" className="hover:text-foreground transition-colors">
          {footerT("cgv")}
        </Link>
        <span aria-hidden="true">•</span>
        <Link href="/cgu" className="hover:text-foreground transition-colors">
          {footerT("cgu")}
        </Link>
        <span aria-hidden="true">•</span>
        <a
          href={`mailto:${footerT("contactEmail")}`}
          className="hover:text-foreground transition-colors"
        >
          {footerT("contactLabel")}: {footerT("contactEmail")}
        </a>
      </div>

      <div className="flex-1 min-w-[160px] flex items-center justify-end gap-3">
        {socials.map(({ href, Icon, label }) => (
          <Link
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className={cn(
              "h-9 w-9 rounded-full border border-white/10 flex items-center justify-center",
              "hover:bg-white/10 hover:text-foreground transition-colors"
            )}
          >
            <Icon className="h-4 w-4" />
          </Link>
        ))}
      </div>
    </div>
  );
}
