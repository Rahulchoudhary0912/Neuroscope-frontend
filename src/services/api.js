import axios from "axios";

// Load from environment (Hugging Face Space URL for production)
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://rahul09122004-neuroscope.hf.space";

console.log("🚀 API Base URL:", API_BASE_URL);

// Create a single Axios instance with timeout and headers
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for ML predictions
  headers: {
    "Content-Type": "application/json",
  },
});

// 🧩 Segmentation API - Process MRI and return segmentation mask
export const predictSegmentation = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const res = await api.post("/predict", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 45000, // Longer timeout for segmentation
    });
    console.log("✅ Segmentation result:", res.data);
    return res.data;
  } catch (err) {
    const errorMessage =
      err.response?.data?.error ||
      err.message ||
      "Segmentation failed. Please check your connection.";
    console.error("❌ Segmentation error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// 🧩 Tumor Classification API - Classify tumor type
export const predictTumorType = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const res = await api.post("/predict-type", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 45000,
    });
    console.log("✅ Tumor classification result:", res.data);
    return res.data;
  } catch (err) {
    const errorMessage =
      err.response?.data?.error ||
      err.message ||
      "Classification failed. Please check your connection.";
    console.error("❌ Classification error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// 🧠 MRI Verification API - ensure upload is a brain MRI
export const verifyBrainMRI = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const res = await api.post("/verify-mri", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 20000,
    });
    console.log("✅ MRI verification result:", res.data);
    return res.data;
  } catch (err) {
    const errorMessage =
      err.response?.data?.error ||
      err.message ||
      "MRI verification failed. Please try again.";
    console.error("❌ MRI verification error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// 🤖 Chatbot API - Ask medical questions
export const askChatbot = async (question) => {
  try {
    const res = await api.post("/chatbot", { question });
    console.log("✅ Chatbot response:", res.data);
    return res.data;
  } catch (err) {
    const errorMessage =
      err.response?.data?.error ||
      err.message ||
      "Chatbot is unavailable. Please try again.";
    console.error("❌ Chatbot error:", errorMessage);
    throw new Error(errorMessage);
  }
};

export default api;
