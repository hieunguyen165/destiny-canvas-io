import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function Prose({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("prose-tuvi", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      <style>{`
        .prose-tuvi h2 {
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-weight: 600;
          margin: 1.4rem 0 0.6rem;
          color: var(--primary);
          border-bottom: 1px dashed var(--border);
          padding-bottom: 0.35rem;
        }
        .prose-tuvi h2:first-child { margin-top: 0; }
        .prose-tuvi p { margin: 0.5rem 0; line-height: 1.7; }
        .prose-tuvi ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
        .prose-tuvi li { margin: 0.25rem 0; line-height: 1.7; }
        .prose-tuvi strong { color: var(--foreground); font-weight: 600; }
        .prose-tuvi table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.92rem; }
        .prose-tuvi th, .prose-tuvi td { border: 1px solid var(--border); padding: 0.5rem 0.6rem; text-align: left; }
        .prose-tuvi th { background: var(--accent); font-family: var(--font-display); }
        .prose-tuvi tr:nth-child(even) td { background: oklch(0.97 0.018 80 / 0.5); }
      `}</style>
    </div>
  );
}
