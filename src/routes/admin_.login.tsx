import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PitchLines } from "@/components/common/PitchLines";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Admin Sign In | KMGMT" }, { name: "robots", content: "noindex" }],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("Incorrect email or password.");
        return;
      }
      const { data: ok } = await supabase.rpc("is_admin");
      if (!ok) {
        await supabase.auth.signOut();
        setError("This account does not have admin access.");
        return;
      }
      await navigate({ to: "/admin", replace: true });
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative isolate flex min-h-screen min-h-dvh flex-col overflow-hidden bg-ink text-ink-foreground">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(180,140,60,0.09),transparent_55%)]"
        aria-hidden
      />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-7 sm:px-8 sm:py-9">
        <Link to="/" aria-label="KMGMT home" className="wordmark text-xl sm:text-2xl">
          KMGMT
        </Link>
        <Link
          to="/"
          className="group inline-flex min-h-11 items-center gap-2 text-xs text-ink-foreground/65 transition-colors hover:text-gold sm:text-sm"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 motion-reduce:transform-none"
            aria-hidden
          />
          Back to website
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto grid w-full max-w-md overflow-hidden rounded-md border border-gold/20 shadow-[0_24px_80px_rgba(0,0,0,0.2)] lg:max-w-none lg:grid-cols-[1fr_1fr]">
          <aside
            className="relative isolate hidden flex-col justify-between overflow-hidden bg-[#141310] p-12 lg:flex xl:p-14"
            aria-label="Your KMGMT workspace"
          >
            <PitchLines className="absolute -bottom-32 -right-36 -z-10 w-[540px] rotate-[-18deg] text-gold/10" />
            <div
              className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-[#141310]/75"
              aria-hidden
            />
            <div>
              <p className="eyebrow flex items-center gap-3 text-gold">
                <span className="h-px w-8 bg-gold/60" aria-hidden />
                Behind the game
              </p>
              <h2 className="mt-9 text-[2.75rem] font-semibold leading-[1.1] tracking-[-0.04em] xl:text-5xl">
                Every detail.
                <br />
                Every player.
                <br />
                <span className="text-gold">One clear view.</span>
              </h2>
              <p className="mt-6 max-w-xs text-sm leading-7 text-ink-foreground/60">
                The workspace for the conversations, decisions and next steps that move careers
                forward.
              </p>
            </div>
            <div className="mt-16">
              <ul className="space-y-4 border-t border-gold/20 pt-6">
                {[
                  "Consultations & bookings",
                  "Availability & scheduling",
                  "Players & enquiries",
                ].map((item, i) => (
                  <li key={item} className="flex items-center gap-4 text-sm text-ink-foreground/75">
                    <span
                      className="font-display text-[10px] tracking-widest text-gold/70"
                      aria-hidden
                    >
                      0{i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-9 text-[10px] uppercase tracking-[0.2em] text-ink-foreground/40">
                Independent guidance. Clear direction.
              </p>
            </div>
          </aside>

          <section
            className="bg-background px-6 py-9 text-foreground sm:px-10 sm:py-12 lg:px-12 xl:px-14"
            aria-labelledby="login-heading"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="eyebrow home-eyebrow">Admin access</p>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 text-[#806022]"
                aria-hidden
              >
                <LockKeyhole className="h-4 w-4" strokeWidth={1.5} />
              </span>
            </div>
            <h1
              id="login-heading"
              className="mt-7 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
            >
              Welcome back.
            </h1>
            <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
              Sign in to manage your KMGMT workspace.
            </p>

            <form onSubmit={submit} className="mt-9 space-y-6" aria-busy={loading}>
              <div className="space-y-2.5">
                <Label htmlFor="admin-email" className="text-sm font-semibold">
                  Email address
                </Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <Input
                    id="admin-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                    aria-describedby={error ? "login-error" : undefined}
                    className="h-13 bg-white/60 pl-11 text-base shadow-none focus-visible:border-gold"
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="admin-password" className="text-sm font-semibold">
                  Password
                </Label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <Input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    aria-describedby={error ? "login-error" : undefined}
                    className="h-13 bg-white/60 pl-11 pr-12 text-base shadow-none focus-visible:border-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-controls="admin-password"
                    disabled={loading}
                    className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-[#806022] disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <div
                  id="login-error"
                  role="alert"
                  className="flex gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3.5 text-sm leading-6 text-destructive"
                >
                  <CircleAlert className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                  <p>{error}</p>
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="booking-button h-13 w-full justify-between px-5 hover:bg-gold hover:text-ink"
              >
                {loading ? "Signing in…" : "Sign in to dashboard"}
                {loading ? (
                  <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden />
                ) : (
                  <ArrowRight className="cta-arrow" aria-hidden />
                )}
              </Button>
            </form>
            <div className="mt-8 flex items-start gap-2.5 border-t border-gold/20 pt-6 text-xs leading-5 text-muted-foreground">
              <LockKeyhole
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#806022]"
                strokeWidth={1.5}
                aria-hidden
              />
              <p>
                For authorised KMGMT administrators.
                <br />
                Use the credentials provided for your account.
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-7 text-[10px] uppercase tracking-[0.16em] text-ink-foreground/40 sm:px-8">
        <p>Football career consultancy</p>
        <p>KMGMT · Admin workspace</p>
      </footer>
    </div>
  );
}
