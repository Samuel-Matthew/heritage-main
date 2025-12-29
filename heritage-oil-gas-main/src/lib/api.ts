// import axios from 'axios';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL,
//   withCredentials: true,
//   headers: {
//     'X-Requested-With': 'XMLHttpRequest',
//     'Accept': 'application/json',
//     'Content-Type': 'application/json',
//   },
// });

// // Add request interceptor to include CSRF token
// api.interceptors.request.use((config) => {
//   const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
//                getCookie('XSRF-TOKEN');
//   if (token) {
//     config.headers['X-XSRF-TOKEN'] = token;
//   }
//   console.log('Request:', {
//     url: config.url,
//     method: config.method,
//     headers: config.headers,
//     baseURL: config.baseURL,
//   });
//   return config;
// });

// // Add response interceptor for debugging
// api.interceptors.response.use(
//   (response) => {
//     console.log('Response:', response);
//     return response;
//   },
//   (error) => {
//     console.error('API Error:', error);
//     return Promise.reject(error);
//   }
// );

// // Helper function to get cookie value
// function getCookie(name: string): string | null {
//   const value = `; ${document.cookie}`;
//   const parts = value.split(`; ${name}=`);
//   if (parts.length === 2) {
//     return parts.pop()?.split(';').shift() || null;
//   }
//   return null;
// }

// export default api;


import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

/**
 * Attach CSRF token automatically and add cache-busting headers
 */
api.interceptors.request.use((config) => {
  // CRITICAL: Ensure credentials are always included (cookies, auth headers)
  config.withCredentials = true;
  
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];

  if (token) {
    config.headers["X-XSRF-TOKEN"] = decodeURIComponent(token);
  }

  // Add cache-busting headers to prevent browser caching
  config.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
  config.headers["Pragma"] = "no-cache";
  config.headers["Expires"] = "0";

  // Add timestamp to GET requests on auth endpoints (not POST to avoid breaking form data)
  if (config.method?.toUpperCase() === "GET" && 
      (config.url?.includes("/api/login") || config.url?.includes("/api/register"))) {
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
  }

  // Log requests in development
  if (config.url?.includes("/api/login") || config.url?.includes("/sanctum")) {
    console.log("[API Request]", {
      url: `${config.baseURL}${config.url}`,
      method: config.method?.toUpperCase(),
      data: config.data,
      withCredentials: config.withCredentials,
      headers: config.headers,
      params: config.params,
    });
  }

  return config;
});

/**
 * Log responses for debugging
 */
api.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes("/api/login") || response.config.url?.includes("/sanctum")) {
      console.log("[API Response]", {
        url: response.config.url,
        status: response.status,
        headers: response.headers,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    console.error("[API Error]", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

/**
 * Get full image URL from API image path
 */
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return "https://via.placeholder.com/400x400?text=No+Image";
  }
  
  // If already a full URL, return as is
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  
  // For store documents (store-documents/...), prepend /storage/
  if (imagePath.includes("store-documents")) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    return `${baseUrl}/storage/${imagePath}`;
  }
  
  // Construct full URL from relative path
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  return `${baseUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

export default api;
