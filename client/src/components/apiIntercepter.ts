import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { server } from "../main";

//   TYPES
interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface ErrorResponse {
  code?: string;
  message?: string;
}

type QueueItem = {
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
};

 //  AXIOS INSTANCE
const api: AxiosInstance = axios.create({
  baseURL: server,
  withCredentials: true,
});

//  CSRF COOKIE
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop()!.split(";")[0] : null;
};

//  REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const method = config.method?.toLowerCase();

    if (method === "post" || method === "put" || method === "delete") {
      const csrfToken = getCookie("csrfToken");
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    throw error;
  }
);

//   QUEUES
let isRefreshing = false;
let isRefreshingCSRFToken = false;

let refreshQueue: QueueItem[] = [];
let csrfQueue: QueueItem[] = [];

const processQueue = (queue: QueueItem[], error?: unknown): void => {
  for (const { resolve, reject } of queue) {
    if (error) reject(error);
    else resolve();
  }
  queue.length = 0;
};

//  RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as
      | RetryAxiosRequestConfig
      | undefined;

    if (!originalRequest) {
      throw error;
    }

    const status = error.response?.status;
    const errorCode = error.response?.data?.code;

    /*  CSRF HANDLING  */
    if (status === 403 && errorCode?.startsWith("CSRF_")) {
      if (isRefreshingCSRFToken) {
        await new Promise((resolve, reject) => {
          csrfQueue.push({ resolve, reject });
        });
        return api(originalRequest);
      }

      originalRequest._retry = true;
      isRefreshingCSRFToken = true;

      try {
        await api.post("/auth/v1/refresh-csrf");
        processQueue(csrfQueue);
        return api(originalRequest);
      } catch (csrfError) {
        processQueue(csrfQueue, csrfError);
        throw csrfError;
      } finally {
        isRefreshingCSRFToken = false;
      }
    }

// AUTH REFRESH  
    if (
      status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/v1/refresh")
    ) {
      throw error;
    }

    if (isRefreshing) {
      await new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      });
      return api(originalRequest);
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post("/auth/v1/refresh");
      processQueue(refreshQueue);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshQueue, refreshError);
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
