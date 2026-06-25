"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateMapPointStatus, deleteMapPoint } from "@/lib/actions/map-points";
import type { MapPointStatus } from "@/lib/types/map-point";

interface MapPointActionsProps {
  id: string;
  status: MapPointStatus;
}

export function MapPointActions({ id, status }: MapPointActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setStatus(next: MapPointStatus) {
    startTransition(async () => {
      await updateMapPointStatus(id, next);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this map point permanently?")) return;
    startTransition(async () => {
      await deleteMapPoint(id);
      router.push("/admin/map");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isPending && <Loader2 className="size-4 animate-spin text-white/40" />}

      {status !== "published" && (
        <Button size="sm" onClick={() => setStatus("published")} disabled={isPending}>
          Publish
        </Button>
      )}
      {status !== "pending" && status !== "published" && (
        <Button size="sm" variant="outline" onClick={() => setStatus("pending")} disabled={isPending}>
          Mark pending
        </Button>
      )}
      {status !== "rejected" && (
        <Button size="sm" variant="outline" onClick={() => setStatus("rejected")} disabled={isPending}>
          Reject
        </Button>
      )}
      {status !== "draft" && (
        <Button size="sm" variant="outline" onClick={() => setStatus("draft")} disabled={isPending}>
          Unpublish
        </Button>
      )}
      <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
        Delete
      </Button>
    </div>
  );
}
