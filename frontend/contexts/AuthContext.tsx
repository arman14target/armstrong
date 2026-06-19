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
  apiGetCurrentUser,
  apiSignIn,
  apiSignInWithApple,
  apiSignInWithGoogle,
  apiSignOut,
  apiSignUp,
} from "@/lib/api/auth";
import { ApiError, isApiConfigured, type AppUser } from "@/lib/api/client";
import { isGoogleConfigured } from "@/lib/googleAuth";
import { isAppleConfigured } from "@/lib/appleAuth";

export interface AuthResult {
  error: string | null;
  userId: string | null;
}

interface AuthContextValue {
  configured: boolean;
  googleConfigured: boolean;
  appleConfigured: boolean;
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: (idToken: string) => Promise<AuthResult>;
  signInWithApple: (identityToken: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function formatAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Email or password is incorrect.";
  }

  if (message.includes("User already registered")) {
    return "An account with this email already exists. Try signing in.";
  }

  if (message.includes("Password should be at least")) {
    return "Password must be at least 6 characters.";
  }

  if (message.includes("Invalid Google sign-in")) {
    return "Google sign-in failed. Please try again.";
  }

  if (message.includes("Invalid Apple sign-in")) {
    return "Apple sign-in failed. Please try again.";
  }

  if (message.includes("is not configured")) {
    return "That sign-in method is not available right now.";
  }

  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(isApiConfigured());

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }

    let mounted = true;

    apiGetCurrentUser()
      .then((currentUser) => {
        if (mounted) {
          setUser(currentUser);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const authenticate = useCallback(
    async (
      action: (email: string, password: string) => Promise<AppUser>,
      email: string,
      password: string,
    ): Promise<AuthResult> => {
      try {
        const authedUser = await action(email.trim(), password);
        setUser(authedUser);
        return { error: null, userId: authedUser.id };
      } catch (error) {
        const message =
          error instanceof ApiError
            ? formatAuthError(error.message)
            : "Something went wrong. Please try again.";
        return { error: message, userId: null };
      }
    },
    [],
  );

  const signIn = useCallback(
    (email: string, password: string) =>
      authenticate(apiSignIn, email, password),
    [authenticate],
  );

  const signUp = useCallback(
    (email: string, password: string) =>
      authenticate(apiSignUp, email, password),
    [authenticate],
  );

  const socialAuthenticate = useCallback(
    async (
      action: (token: string) => Promise<AppUser>,
      token: string,
    ): Promise<AuthResult> => {
      try {
        const authedUser = await action(token);
        setUser(authedUser);
        return { error: null, userId: authedUser.id };
      } catch (error) {
        const message =
          error instanceof ApiError
            ? formatAuthError(error.message)
            : "Something went wrong. Please try again.";
        return { error: message, userId: null };
      }
    },
    [],
  );

  const signInWithGoogle = useCallback(
    (idToken: string) => socialAuthenticate(apiSignInWithGoogle, idToken),
    [socialAuthenticate],
  );

  const signInWithApple = useCallback(
    (identityToken: string) =>
      socialAuthenticate(apiSignInWithApple, identityToken),
    [socialAuthenticate],
  );

  const signOut = useCallback(async () => {
    apiSignOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      configured: isApiConfigured(),
      googleConfigured: isGoogleConfigured(),
      appleConfigured: isAppleConfigured(),
      user,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      signOut,
    }),
    [
      user,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
