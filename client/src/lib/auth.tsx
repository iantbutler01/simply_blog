import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  roles: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthContextType>({
    user: null,
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => {
        setAuthState({
          user: data.user,
          isAdmin: data.isAdmin,
          isLoading: false,
        });
      })
      .catch(() => {
        setAuthState({
          user: null,
          isAdmin: false,
          isLoading: false,
        });
      });
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
