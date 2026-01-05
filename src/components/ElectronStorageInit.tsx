// File: src/components/ElectronStorageInit.tsx

"use client";

import { initializeElectronStorage } from "@/utils/electronStorage";
import { useEffect } from "react";

export function ElectronStorageInit() {
  useEffect(() => {
    void initializeElectronStorage();
  }, []);

  return null;
}
