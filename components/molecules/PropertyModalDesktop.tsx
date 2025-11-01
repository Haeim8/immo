"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function PropertyModal({ isOpen, onClose, children }: PropertyModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-6xl lg:max-w-[1200px] max-h-[90vh] lg:max-h-none overflow-y-auto lg:overflow-visible rounded-3xl border border-white/10 bg-background/95 backdrop-blur-xl px-4 sm:px-6 lg:px-10 pb-10 sm:pb-12 lg:pb-16"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-full p-2 hover:bg-white/10 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Content */}
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
