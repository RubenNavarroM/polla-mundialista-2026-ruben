"use client";

import { useState, useTransition } from "react";
import { EmojiPicker } from "@/components/EmojiPicker";
import { useToast } from "@/components/Toast";
import { updateAvatar } from "./actions";

export function AvatarForm({ current }: { current: string | null }) {
  const [emoji, setEmoji] = useState(current ?? "⚽");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleChange(newEmoji: string) {
    setEmoji(newEmoji);
    const formData = new FormData();
    formData.set("avatar_url", newEmoji);
    startTransition(async () => {
      const result = await updateAvatar(formData);
      if (result?.error) toast(result.error, "error");
      else toast("Avatar actualizado", "success");
    });
  }

  return (
    <div className="relative">
      <EmojiPicker value={emoji} onChange={handleChange} />
      {isPending && (
        <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
          <span className="text-xs">...</span>
        </div>
      )}
    </div>
  );
}
