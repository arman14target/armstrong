"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  adminMe,
  adminSignIn,
  adminSignOut,
  ApiError,
  type AdminUser,
} from "@/lib/api";

interface AdminAuthValue {
  admin: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    adminMe()
      .then((a) => mounted && setAdmin(a))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const a = await adminSignIn(email.trim(), password);
      setAdmin(a);
      return null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return "Email or password is incorrect.";
      }
      return error instanceof ApiError
        ? error.message
        : "Something went wrong. Please try again.";
    }
  }, []);

  const signOut = useCallback(() => {
    adminSignOut();
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({ admin, loading, signIn, signOut }),
    [admin, loading, signIn, signOut],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
