// src/lib/http.js
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;
if (!baseURL && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn("VITE_API_URL is not set. Requests may fail.");
}

export const http = axios.create({
    baseURL,
    timeout: 15000
});

http.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (!config.headers) config.headers = {};
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (!config.headers["Content-Type"] && config.method !== "get") {
        config.headers["Content-Type"] = "application/json";
    }
    return config;
});

function toMsg(error) {
    return (
        error?.response?.data?.msg ||
        error?.response?.data?.message ||
        error?.response?.statusText ||
        error?.message ||
        "Request failed"
    );
}

http.interceptors.response.use(
    (r) => r,
    (err) => {
        const status = err?.response?.status;
        const msg = toMsg(err);
        if (status === 401) localStorage.removeItem("token");
        if (status === 423 && import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn("Account locked");
        }
        return Promise.reject(new Error(msg));
    }
);
