import { createClient } from "./client/client";

export const apiClient = createClient({
    baseURL: "/api",
    throwOnError: true,
});