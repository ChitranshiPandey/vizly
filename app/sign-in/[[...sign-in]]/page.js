import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at top, #0f1729 0%, #050810 100%)" }}
    >
      <SignIn />
    </main>
  );
}