import { apiClient } from "@/api/api-client";

/**
 * Download a file from API and trigger browser save.
 * Handles Authorization automatically via configured apiClient.
 */
export async function downloadApiFile(
  url: string,
  filename: string,
): Promise<void> {
  const response = await apiClient.instance.request<Blob>({
    url,
    method: "GET",
    responseType: "blob",
    baseURL: "/",
  });

  const blob = response.data;
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}


