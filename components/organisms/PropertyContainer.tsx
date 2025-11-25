"use client";

import { Search } from "lucide-react";

export default function PropertyContainer() {
  return (
    <div className="w-full space-y-8">
      <div className="py-12 text-center text-muted-foreground">
        <Search className="mx-auto h-12 w-12 opacity-20 mb-4" />
        <p className="text-lg font-semibold">No vaults available yet</p>
        <p className="text-sm mt-2">New vaults will be added soon.</p>
      </div>
    </div>
  );
}
