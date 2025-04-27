

import { Request, Response, NextFunction } from "express";

export const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = res.locals.role;

    if (!roles.includes(role)) {
      return res.status(403).json({ message: "Access denied. you don't have permission to access this resource." });
    }

    next();
  };
};
