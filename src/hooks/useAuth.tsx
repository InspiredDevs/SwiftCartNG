import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSeller: boolean;
  isCustomer: boolean;
  userRole: 'admin' | 'seller' | 'customer' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role?: 'customer' | 'seller') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'seller' | 'customer' | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin role after state change
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsSeller(false);
          setIsCustomer(false);
          setUserRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setUserRole(data.role as 'admin' | 'seller' | 'customer');
        setIsAdmin(data.role === 'admin');
        setIsSeller(data.role === 'seller');
        setIsCustomer(data.role === 'customer');
      } else {
        setUserRole(null);
        setIsAdmin(false);
        setIsSeller(false);
        setIsCustomer(false);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole(null);
      setIsAdmin(false);
      setIsSeller(false);
      setIsCustomer(false);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      // Check user role and redirect accordingly
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();
      
      if (roleData?.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (roleData?.role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/');
      }
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'customer' | 'seller' = 'customer') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsSeller(false);
    setIsCustomer(false);
    setUserRole(null);
    // Cart is saved in DB, no need to clear it - it will be restored on next login
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isSeller, isCustomer, userRole, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
