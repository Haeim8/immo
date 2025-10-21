"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "@/components/providers/IntlProvider";
import { DiscordLogoIcon, TwitterLogoIcon, InstagramLogoIcon } from "@radix-ui/react-icons";
import { Facebook, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

const TikTokIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M13.5 3v8.05a3.45 3.45 0 1 1-2.4-3.29V5.1A5.9 5.9 0 0 0 7 11.01 5.99 5.99 0 1 0 15 17V7.38a5.25 5.25 0 0 0 3.42 1.24V6.5A2.75 2.75 0 0 1 15.67 3h-2.17z"
      fill="currentColor"
    />
  </svg>
);

const socials = [
  {
    href: "https://usci.tech/discord",
    Icon: DiscordLogoIcon,
    label: "Discord",
  },
  {
    href: "https://usci.tech/x",
    Icon: TwitterLogoIcon,
    label: "X",
  },
  {
    href: "https://usci.tech/instagram",
    Icon: InstagramLogoIcon,
    label: "Instagram",
  },
  {
    href: "https://usci.tech/tiktok",
    Icon: TikTokIcon,
    label: "TikTok",
  },
  {
    href: "https://usci.tech/linkedin",
    Icon: Linkedin,
    label: "LinkedIn",
  },
  {
    href: "https://usci.tech/facebook",
    Icon: Facebook,
    label: "Facebook",
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
