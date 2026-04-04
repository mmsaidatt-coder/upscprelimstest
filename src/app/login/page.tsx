import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-blueprint-grid w-full min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md card-elevated border-2 border-[#262626] bg-[#0e0e0e]/95 backdrop-blur-md rounded-[2rem] p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center animate-pulse">
            <div className="h-8 w-48 bg-[#333] rounded mx-auto mb-4"></div>
            <div className="h-4 w-32 bg-[#222] rounded mx-auto"></div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
