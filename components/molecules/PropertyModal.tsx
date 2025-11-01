"use client";

import { useEffect, useState } from "react";
import { Sheet } from "react-modal-sheet";
import PropertyModalDesktop from "./PropertyModalDesktop";
import { X } from "lucide-react";

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function PropertyModal({
  isOpen,
  onClose,
  children,
}: PropertyModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // On desktop, use the existing PropertyModal
  if (!isMobile) {
    return (
      <PropertyModalDesktop isOpen={isOpen} onClose={onClose}>
        {children}
      </PropertyModalDesktop>
    );
  }

  // On mobile, use bottom sheet
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      detent="full"
      tweenConfig={{ ease: "easeOut", duration: 0.3 }}
    >
      <Sheet.Container className="bg-background/95 backdrop-blur-xl">
        <Sheet.Header className="relative border-b border-white/10 pb-4">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 hover:bg-white/10 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </Sheet.Header>
        <Sheet.Content className="px-4 pb-8">
          {children}
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={onClose} />
    </Sheet>
  );
}
