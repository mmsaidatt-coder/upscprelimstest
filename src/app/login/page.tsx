import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-lg px-6 py-16">
          <div className="mesh-card rounded-[2.4rem] p-8 md:p-10">
            <p className="text-sm text-[var(--muted)]">Loading...</p>
          </div>
        </section>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
