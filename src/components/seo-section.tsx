import { ReactNode } from "react";

/**
 * Section nội dung SEO cuối trang — nhồi từ khoá tự nhiên qua h2/h3 + đoạn văn ngắn.
 * Render dạng <section> riêng, có heading h2 để Google trích xuất.
 */
export function SeoSection({
  title,
  intro,
  blocks,
  faqs,
}: {
  title: string;
  intro?: string;
  blocks?: { heading: string; body: ReactNode }[];
  faqs?: { q: string; a: string }[];
}) {
  return (
    <section className="mt-16 w-full">
      <div className="w-full rounded-2xl border border-border/60 bg-background/60 p-6 sm:p-10 shadow-soft backdrop-blur">
        <h2 className="font-display text-2xl font-semibold text-primary sm:text-3xl">
          {title}
        </h2>
        {intro && (
          <p className="mt-3 text-sm leading-relaxed text-foreground/80 sm:text-base">{intro}</p>
        )}

        {blocks && blocks.length > 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {blocks.map((b) => (
              <article key={b.heading} className="rounded-xl border border-border/40 bg-background/50 p-4">
                <h3 className="font-display text-base font-semibold text-foreground">{b.heading}</h3>
                <div className="mt-2 text-sm leading-relaxed text-foreground/75">{b.body}</div>
              </article>
            ))}
          </div>
        )}

        {faqs && faqs.length > 0 && (
          <div className="mt-8">
            <h3 className="font-display text-lg font-semibold text-foreground">Câu hỏi thường gặp</h3>
            <dl className="mt-3 space-y-3">
              {faqs.map((f) => (
                <div key={f.q} className="rounded-lg border border-border/40 bg-background/50 p-4">
                  <dt className="font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-foreground/75">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
