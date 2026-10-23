import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAuthenticating: boolean;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Save or update user document in Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Usuario',
              photoURL: user.photoURL || '',
              createdAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.warn('No se pudo verificar el perfil del usuario en Firestore:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<boolean> => {
    if (isAuthenticating) return false;
    setIsAuthenticating(true);
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (error: any) {
      const code = error?.code || '';
      // Gracefully handle user cancellation or popup blocking without unhandled errors
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // Expected cancellation when user closes the Google login window
        return false;
      }
      if (code === 'auth/popup-blocked') {
        alert('La ventana emergente de inicio de sesión fue bloqueada por el navegador. Por favor permite las ventanas emergentes en este sitio para iniciar sesión.');
        return false;
      }
      console.warn('Aviso de inicio de sesión:', error?.message || error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn('Aviso al cerrar sesión:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAuthenticating, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
