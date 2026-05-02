import { Router, type IRouter } from "express";

const router: IRouter = Router();

const USERS = [
  {
    username: "hero",
    password: process.env["USER_PASSWORD"] ?? "hero123",
    userId: 1,
    role: "user" as const,
    displayName: "Hero",
  },
  {
    username: "admin",
    password: process.env["ADMIN_PASSWORD"] ?? "admin123",
    userId: 999,
    role: "admin" as const,
    displayName: "Admin",
  },
];

router.post("/auth/login", (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const user = USERS.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password,
  );

  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  req.session.userId = user.userId;
  req.session.username = user.username;
  req.session.role = user.role;

  req.session.save((err) => {
    if (err) {
      req.log.error(err);
      res.status(500).json({ error: "Session error" });
      return;
    }
    res.json({ username: user.username, role: user.role, displayName: user.displayName });
  });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      req.log.error(err);
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res) => {
  if (!req.session?.role) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const display = USERS.find((u) => u.username === req.session.username);
  res.json({
    username: req.session.username,
    role: req.session.role,
    displayName: display?.displayName ?? req.session.username,
  });
});

export default router;
