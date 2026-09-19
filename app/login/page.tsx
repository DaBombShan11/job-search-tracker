"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");

  // If already logged in, don't make the user log in again.
  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/");
        return;
      }

      setCheckingSession(false);
    }

    checkSession();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage(
        "Account created! Check your email to confirm your account, then come back and log in. 🌸"
      );

      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  function switchMode() {
    setIsSignUp(!isSignUp);
    setMessage("");
    setName("");
    setEmail("");
    setPassword("");
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-100 via-pink-50 to-rose-100">
        <p className="font-medium text-pink-700">
          Loading your tracker... 🌸
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-100 via-pink-50 to-rose-100 p-6">
      <div className="w-full max-w-md rounded-3xl border border-pink-200 bg-white/90 p-8 shadow-xl">

        {/* Header */}
        <div className="text-center">
          <div className="text-4xl">🌸</div>

          <h1 className="mt-3 text-3xl font-bold text-pink-950">
            Job Search Accountability
          </h1>

          <p className="mt-2 text-pink-600">
            One application every day.
          </p>
        </div>

        {/* Login / Create Account Toggle */}
        <div className="mt-8 grid grid-cols-2 rounded-xl bg-pink-100 p-1">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setMessage("");
            }}
            className={`rounded-lg px-4 py-2 font-medium transition ${
              !isSignUp
                ? "bg-white text-pink-800 shadow-sm"
                : "text-pink-500 hover:text-pink-800"
            }`}
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setMessage("");
            }}
            className={`rounded-lg px-4 py-2 font-medium transition ${
              isSignUp
                ? "bg-white text-pink-800 shadow-sm"
                : "text-pink-500 hover:text-pink-800"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">

          {isSignUp && (
            <div>
              <label className="mb-1 block text-sm font-medium text-pink-950">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Ashanti"
                className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-pink-950">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-pink-950">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            />
          </div>

          {message && (
            <div className="rounded-xl border border-pink-200 bg-pink-50 p-3 text-sm text-pink-800">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isSignUp
                ? "Create Account"
                : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-pink-500">
          {isSignUp
            ? "Already have an account?"
            : "Don't have an account?"}{" "}

          <button
            type="button"
            onClick={switchMode}
            className="font-semibold text-pink-700 hover:text-pink-900 hover:underline"
          >
            {isSignUp ? "Log in" : "Create one"}
          </button>
        </p>
      </div>
    </main>
  );
}