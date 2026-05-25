import { create } from "zustand";

export const useResumeStore = create((set) => ({
  resumes: [],
  currentResume: null,
  currentAnalysis: null,
  analysisHistory: [],
  isLoading: false,
  error: null,

  setResumes: (resumes) => set({ resumes }),
  setCurrentResume: (resume) => set({ currentResume: resume }),
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setAnalysisHistory: (history) => set({ analysisHistory: history }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addResume: (resume) =>
    set((state) => ({ resumes: [resume, ...state.resumes] })),

  removeResume: (id) =>
    set((state) => ({ resumes: state.resumes.filter((r) => r.id !== id) })),

  reset: () =>
    set({
      resumes: [],
      currentResume: null,
      currentAnalysis: null,
      analysisHistory: [],
      isLoading: false,
      error: null,
    }),
}));
