"use client";
import { AuthGate } from "@/components/layout/auth";
import { Shell } from "@/components/layout/shell";
import { StoreProvider } from "@/lib/store/store";
import { ConfirmProvider } from "@/components/ui/confirm";
import { UIProvider } from "@/components/dialogs";
import { Toaster } from "@/components/ui/toaster";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <StoreProvider>
        <ConfirmProvider>
          <UIProvider>
            <Shell>{children}</Shell>
            <Toaster />
          </UIProvider>
        </ConfirmProvider>
      </StoreProvider>
    </AuthGate>
  );
}
