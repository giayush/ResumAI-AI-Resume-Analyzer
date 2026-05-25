import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuthStore } from "../store/authStore";
import { authAPI } from "../services/api";
import { toast } from "react-hot-toast";

/**
 * useAuth — convenience hook exposing auth state + actions.
 */
export function useAuth() {
  const navigate = useNavigate();
  const { user, firebaseUser, isAuthenticated, logout: storeLogout } = useAuthStore();

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore sign-out errors
    }
    storeLogout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.me();
      useAuthStore.getState().updateUser(res.data.user);
      return res.data.user;
    } catch {
      return null;
    }
  };

  return {
    user,
    firebaseUser,
    isAuthenticated,
    isAdmin: user?.role === "admin",
    logout,
    refreshUser,
  };
}
