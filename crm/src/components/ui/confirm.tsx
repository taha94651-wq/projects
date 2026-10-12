"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Modal } from "./dialog";
import { Button } from "./button";
import { useI18n } from "@/lib/i18n";

interface Opts {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
}
const Ctx = createContext<(o: Opts) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [opts, setOpts] = useState<Opts | null>(null);
  const resolver = useRef<(v: boolean) => void>(() => {});
  const confirm = useCallback(
    (o: Opts) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setOpts(o);
      }),
    [],
  );
  const close = (v: boolean) => {
    resolver.current(v);
    setOpts(null);
  };
  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Modal
        open={!!opts}
        onOpenChange={(o) => !o && close(false)}
        title={opts?.title ?? ""}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => close(false)}>
              {t("cancel")}
            </Button>
            <Button variant={opts?.destructive === false ? "default" : "destructive"} onClick={() => close(true)} autoFocus>
              {opts?.confirmLabel ?? t("delete")}
            </Button>
          </>
        }
      >
        <div className="text-sm text-muted-foreground">{opts?.message}</div>
      </Modal>
    </Ctx.Provider>
  );
}
