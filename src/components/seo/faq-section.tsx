export function FaqSection({
  title = "Frequently asked questions",
  faqs,
}: {
  title?: string;
  faqs: { question: string; answer: string }[];
}) {
  return (
    <section aria-labelledby="faq-heading" className="mt-12 grid gap-10 lg:grid-cols-[0.42fr_1fr] lg:gap-20">
      <div>
        <p className="editorial-kicker">Frequently asked</p>
        <h2 id="faq-heading" className="heading mt-7 text-3xl text-[var(--foreground)] sm:text-4xl lg:text-5xl">
          {title}
        </h2>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {faqs.map((faq, index) => (
          <details key={faq.question} className="group py-6 sm:py-7">
            <summary className="flex cursor-pointer list-none items-start gap-4 text-base font-semibold text-[var(--foreground)] marker:content-none sm:gap-6">
              <span className="index-number mt-1 shrink-0">{String(index + 1).padStart(2, "0")}</span>
              <span className="flex-1">{faq.question}</span>
              <span aria-hidden="true" className="text-[var(--accent)] transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="ml-10 mt-4 max-w-3xl pr-8 text-sm leading-7 text-[var(--muted)] sm:ml-14">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
