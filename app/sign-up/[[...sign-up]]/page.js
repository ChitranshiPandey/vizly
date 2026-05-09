import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at top, #0f1729 0%, #050810 100%)" }}
    >
      <SignUp />
    </main>
  );
}