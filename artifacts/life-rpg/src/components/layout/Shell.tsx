import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Scroll,
  Heart,
  Coins,
  Store,
  Backpack,
  Users,
  User,
  Shield,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetUserStats } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: stats } = useGetUserStats();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/quests", label: "Quests", icon: Scroll },
    { href: "/health", label: "Health", icon: Heart },
    { href: "/finances", label: "Finances", icon: Coins },
    { href: "/shop", label: "Shop", icon: Store },
    { href: "/inventory", label: "Inventory", icon: Backpack },
    { href: "/group-quests", label: "Guild", icon: Users },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const adminNavItem = { href: "/admin", label: "Admin", icon: Shield };

  async function handleLogout() {
    await logout();
    toast({ title: "Logged out", description: "Until next time, hero." });
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary box-glow">
            <Scroll className="w-5 h-5" />
          </div>
          <div className="font-serif text-xl font-bold tracking-wider text-glow">
            LIFE RPG
          </div>
        </div>

        {/* User Mini Stats */}
        {stats && (
          <div className="p-4 border-b border-border bg-background/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">{stats.user.username}</span>
              <span className="text-xs text-primary font-mono">Lv. {stats.user.level}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 box-glow"
                style={{
                  width: `${Math.min(((stats.user.xp % 500) / 500) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-glow")} />
                {item.label}
              </Link>
            );
          })}

          {/* Admin link — only visible to admin */}
          {user?.role === "admin" && (
            <>
              <div className="my-2 border-t border-border" />
              <Link
                href={adminNavItem.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                  location === adminNavItem.href
                    ? "bg-rose-400/10 text-rose-400 border border-rose-400/30"
                    : "text-rose-400/70 hover:text-rose-400 hover:bg-rose-400/5",
                )}
              >
                <adminNavItem.icon className="w-5 h-5" />
                {adminNavItem.label}
              </Link>
            </>
          )}
        </nav>

        {/* Bottom: session info + logout */}
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
