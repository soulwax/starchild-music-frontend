// File: src/components/MobileContentWrapper.tsx

"use client";

import type { ReactNode } from "react";

interface MobileContentWrapperProps {
  children: ReactNode;
}

export default function MobileContentWrapper({
  children,
}: MobileContentWrapperProps) {

  return <>{children}</>;
}
