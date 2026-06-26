"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCommunityContestAdmin,
  createCommunityPollAdmin,
  selectContestWinnerAdmin,
} from "@/lib/actions/community";

export function AdminCommunityForms() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState("Option A\nOption B");
  const [contestStart, setContestStart] = useState("");
  const [contestEnd, setContestEnd] = useState("");
  const [winnerContestId, setWinnerContestId] = useState("");
  const [winnerPostId, setWinnerPostId] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await createCommunityPollAdmin({
              title: pollTitle,
              options: pollOptions.split("\n"),
              status: "active",
            });
            setPollTitle("");
            router.refresh();
          });
        }}
      >
        <h3 className="font-medium text-white">Create poll</h3>
        <input
          value={pollTitle}
          onChange={(e) => setPollTitle(e.target.value)}
          placeholder="Favorite Character"
          required
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        />
        <textarea
          value={pollOptions}
          onChange={(e) => setPollOptions(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gta-pink px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Publish poll
        </button>
      </form>

      <form
        className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await createCommunityContestAdmin({
              week_start: contestStart,
              week_end: contestEnd,
            });
            router.refresh();
          });
        }}
      >
        <h3 className="font-medium text-white">Start weekly contest</h3>
        <input
          type="date"
          value={contestStart}
          onChange={(e) => setContestStart(e.target.value)}
          required
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        />
        <input
          type="date"
          value={contestEnd}
          onChange={(e) => setContestEnd(e.target.value)}
          required
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gta-pink px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Open contest
        </button>
      </form>

      <form
        className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 lg:col-span-2"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await selectContestWinnerAdmin(winnerContestId, winnerPostId);
            router.refresh();
          });
        }}
      >
        <h3 className="font-medium text-white">Select contest winner</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={winnerContestId}
            onChange={(e) => setWinnerContestId(e.target.value)}
            placeholder="Contest UUID"
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
          <input
            value={winnerPostId}
            onChange={(e) => setWinnerPostId(e.target.value)}
            placeholder="Winning post UUID"
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300 disabled:opacity-50"
        >
          Confirm winner
        </button>
      </form>
    </div>
  );
}
