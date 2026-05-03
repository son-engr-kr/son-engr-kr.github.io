export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)]">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 text-sm sm:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
            Contact
          </h2>
          <ul className="space-y-1 text-[var(--color-fg)]">
            <li>
              <a href="mailto:son.hyo@northeastern.edu">son.hyo@northeastern.edu</a>
            </li>
            <li>
              <a href="mailto:son.engr.kr@gmail.com">son.engr.kr@gmail.com</a>
            </li>
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
            Links
          </h2>
          <ul className="space-y-1">
            <li>
              <a
                href="https://github.com/son-engr-kr"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </li>
            <li>
              <a href="https://hyoungseo.com" target="_blank" rel="noreferrer">
                Portfolio
              </a>
            </li>
          </ul>
        </section>
      </div>
      <div className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-5xl px-6 py-4 text-xs text-[var(--color-fg-muted)]">
          © {new Date().getFullYear()} Hyoungseo Son. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
