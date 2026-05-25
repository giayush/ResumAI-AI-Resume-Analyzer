/**
 * authStore.js — Global auth state using Zustand.
 *
 * With Firebase auth, we no longer store JWT access/refresh tokens.
 * Instead we store the Firebase user object and the DB user profile.
 * The Firebase ID token is fetched fresh from Firebase on every API call
 * via the interceptor in api.js (token auto-refreshes internally).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (token, dbUser) => {
        if (token) {
          localStorage.setItem("token", token);
        } else {
          localStorage.removeItem("token");
        }
        set({ token, user: dbUser, isAuthenticated: true });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: { ...state.user, ...partial },
          isAuthenticated: true,
        })),

      logout: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "resumai-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
