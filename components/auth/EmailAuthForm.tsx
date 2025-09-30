"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface AuthFormProps {
  onToggleMode: () => void;
  isSignUp: boolean;
}

export function EmailAuthForm({ onToggleMode, isSignUp }: AuthFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isSignUp) {
        // Sign up
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Signup failed");
        }

        setSuccess("Account created! You can now sign in.");
        setFormData({ name: "", email: "", password: "" });
        setTimeout(() => onToggleMode(), 2000);
      } else {
        // Sign in
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error("Invalid email or password");
        }

        // Success - NextAuth will handle the redirect
        window.location.href = "/parent/dashboard";
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-paytone-one text-center mb-6 text-santa">
        {isSignUp ? "Create Account" : "Sign In"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-santa"
              placeholder="Enter your full name"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-santa"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-santa"
            placeholder="Enter your password (min. 6 characters)"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded">
            {success}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-santa hover:bg-santa/90"
        >
          {isLoading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onToggleMode}
          className="text-sm text-santa hover:underline"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </button>
      </div>
    </Card>
  );
}