import { Bot, MoreVertical, Send as SendIcon, Zap } from "lucide-react";
import { cn } from "@/components/ui";

type Message = { from: string; text: string };

export function PhoneMock({
  title,
  status,
  messages,
}: {
  title: string;
  status: string;
  messages: Message[];
}) {
  return (
    <div className="relative mx-auto w-[300px] max-w-full">
      <div
        className="absolute -inset-10 -z-10 rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative rounded-[2.4rem] border border-line bg-ink-900 p-2 shadow-[0_40px_80px_-40px_rgba(0,0,0,1)]">
        <div className="overflow-hidden rounded-[2rem] border border-line-soft bg-ink-950">
          {/* status bar */}
          <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[10px] text-slate-500">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              <span className="h-1.5 w-3 rounded-sm bg-slate-500" />
            </span>
          </div>

          {/* bot header */}
          <div className="flex items-center gap-2.5 border-b border-line-soft px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-cyan-300 text-ink-950">
              <Zap size={16} strokeWidth={2.6} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{title}</p>
              <p className="text-[10px] text-mint">{status}</p>
            </div>
            <MoreVertical size={15} className="text-slate-600" />
          </div>

          {/* chat */}
          <div className="flex h-[368px] flex-col gap-2 overflow-hidden px-3 py-3">
            {messages.map((message, index) => {
              const isUser = message.from === "user";
              return (
                <div
                  key={index}
                  className={cn("flex", isUser ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[82%] rounded-2xl px-3 py-2 text-[11.5px] leading-relaxed",
                      isUser
                        ? "rounded-br-md bg-accent font-medium text-ink-950"
                        : "rounded-bl-md border border-line-soft bg-ink-850 text-slate-200",
                    )}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* input */}
          <div className="flex items-center gap-2 border-t border-line-soft px-3 py-2.5">
            <div className="flex-1 rounded-full border border-line px-3 py-1.5 text-[11px] text-slate-600">
              Message…
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-ink-950">
              <SendIcon size={13} />
            </span>
          </div>

          <div className="flex justify-center pb-2 pt-1">
            <span className="h-1 w-24 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-6 hidden rounded-xl border border-line bg-ink-850/95 px-3 py-2 shadow-xl backdrop-blur sm:block">
        <p className="flex items-center gap-1.5 text-[10px] font-medium text-slate-300">
          <Bot size={12} className="text-accent-soft" />
          payment received
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-mint">+890 ₽</p>
      </div>
    </div>
  );
}
