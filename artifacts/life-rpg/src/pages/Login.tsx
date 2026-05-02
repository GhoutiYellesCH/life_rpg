import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scroll, Shield, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md px-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border-2 border-primary mb-4 shadow-lg shadow-primary/30"
            animate={{ boxShadow: ["0 0 15px hsl(270 100% 60% / 0.3)", "0 0 30px hsl(270 100% 60% / 0.5)", "0 0 15px hsl(270 100% 60% / 0.3)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Scroll className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold font-serif tracking-wider text-glow text-primary">
            LIFE RPG
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Enter the Kingdom — your legend awaits</p>
        </div>

        <Card className="border-primary/30 bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-center font-serif flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Identify Yourself, Hero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="hero or admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  data-testid="input-login-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                    data-testid="input-login-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-sm text-center font-medium"
                  data-testid="text-login-error"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                disabled={loading || !username || !password}
                data-testid="button-login-submit"
              >
                {loading ? "Entering the Kingdom..." : "Enter the Kingdom"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-60">
          This realm is protected. Only the worthy may enter.
        </p>
      </motion.div>
    </div>
  );
}
