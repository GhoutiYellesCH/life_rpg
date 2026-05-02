import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.role) {
    res.status(401).json({ error: "Unauthorized – please log in" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.role !== "admin") {
    res.status(403).json({ error: "Forbidden – admin access required" });
    return;
  }
  next();
}
