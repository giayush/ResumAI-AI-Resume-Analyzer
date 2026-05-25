import { useState, useCallback } from "react";
import { resumeAPI, analysisAPI } from "../services/api";
import { useResumeStore } from "../store/resumeStore";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/**
 * useAnalysis — encapsulates the upload → analyze flow.
 * Keeps Upload.jsx thin and reusable.
 */
export function useAnalysis() {
  const navigate = useNavigate();
  const { setCurrentResume, setCurrentAnalysis, addResume, setLoading } = useResumeStore();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [error, setError] = useState(null);

  const uploadResume = useCallback(async (file) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await resumeAPI.upload(formData);
      const resume = res.data.resume;
      setUploadedResume(resume);
      setCurrentResume(resume);
      addResume(resume);
      toast.success("Resume uploaded and parsed ✅");
      return resume;
    } catch (err) {
      const msg = err.response?.data?.error || "Upload failed";
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const runAnalysis = useCallback(async ({ resumeId, jobDescription, jobTitle }) => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await analysisAPI.analyze({
        resume_id: resumeId,
        job_description: jobDescription,
        job_title: jobTitle,
      });
      const analysis = res.data.analysis;
      setCurrentAnalysis(analysis);
      toast.success("Analysis complete 🎉");
      navigate(`/analysis/${analysis.id}`);
      return analysis;
    } catch (err) {
      const msg = err.response?.data?.error || "Analysis failed";
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [navigate]);

  return {
    uploadResume,
    runAnalysis,
    uploading,
    analyzing,
    uploadedResume,
    setUploadedResume,
    error,
  };
}
