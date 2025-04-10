import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, InsertUser } from "@/types";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Create a dummy version of the context to use as a default value
const defaultContext = {
  user: null,
  isLoading: false,
  error: null,
  loginMutation: {
    mutate: () => {},
    isPending: false,
    isError: false,
    error: null,
    reset: () => {},
    context: undefined,
    data: undefined,
    failureCount: 0,
    failureReason: null,
    isSuccess: false,
    variables: undefined,
    status: 'idle',
    mutateAsync: async () => ({} as User),
  },
  logoutMutation: {
    mutate: () => {},
    isPending: false,
    isError: false,
    error: null,
    reset: () => {},
    context: undefined,
    data: undefined,
    failureCount: 0,
    failureReason: null,
    isSuccess: false,
    variables: undefined,
    status: 'idle',
    mutateAsync: async () => {},
  },
  registerMutation: {
    mutate: () => {},
    isPending: false,
    isError: false,
    error: null,
    reset: () => {},
    context: undefined,
    data: undefined,
    failureCount: 0,
    failureReason: null,
    isSuccess: false,
    variables: undefined,
    status: 'idle',
    mutateAsync: async () => ({} as User),
  },
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = InsertUser & {
  confirmPassword: string;
};

export const AuthContext = createContext<AuthContextType>(defaultContext as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Redirect based on user type
      if (user.userType === "salon_owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/");
      }
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً ${user.fullName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل تسجيل الدخول",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Redirect based on user type
      if (user.userType === "salon_owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/");
      }
      
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `مرحباً ${user.fullName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل إنشاء الحساب",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      navigate("/auth");
      
      toast({
        title: "تم تسجيل الخروج بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل تسجيل الخروج",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
