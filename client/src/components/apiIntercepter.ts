import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { server } from "../main";

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}


const api: AxiosInstance = axios.create({
  baseURL: server,
  withCredentials: true,
});


type FailedQueueItem = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];



const processQueue = (error?: unknown): void => {
  for (const { resolve, reject } of failedQueue) {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  }
  failedQueue = [];
};


api.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as
      | RetryAxiosRequestConfig
      | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/v1/refresh")
    ) {
      throw error;
    }

    if (isRefreshing) {
      await new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });

      return api(originalRequest);
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post("/auth/v1/refresh");
      processQueue();
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
