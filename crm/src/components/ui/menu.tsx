"use client";
import * as M from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
  hidden?: boolean;
}

export function Menu({ items, trigger, align = "end" }: { items: MenuItem[]; trigger?: ReactNode; align?: "start" | "end" }) {
  return (
    <M.Root>
      <M.Trigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger ?? (
          <Button variant="ghost" size="iconSm" aria-label="Actions">
            <MoreHorizontal />
          </Button>
        )}
      </M.Trigger>
      <M.Portal>
        <M.Content align={align} sideOffset={4} onClick={(e) => e.stopPropagation()} className="z-50 min-w-[10rem] overflow-hidden rounded-md border bg-card p-1 shadow-lg fade-in">
          {items
            .filter((i) => !i.hidden)
            .map((i, k) => (
              <M.Item
                key={k}
                onSelect={i.onSelect}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded px-2.5 py-1.5 text-sm outline-none data-[highlighted]:bg-accent [&_svg]:size-4",
                  i.destructive && "text-destructive",
                )}
              >
                {i.icon}
                {i.label}
              </M.Item>
            ))}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}
