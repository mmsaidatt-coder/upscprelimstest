import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-warm-grid w-full min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--background)]">
          <div className="w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-white p-8 sm:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.08)] text-center animate-pulse">
            <div className="h-8 w-48 bg-[var(--border)] rounded mx-auto mb-4"></div>
            <div className="h-4 w-32 bg-[var(--border-light)] rounded mx-auto"></div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
