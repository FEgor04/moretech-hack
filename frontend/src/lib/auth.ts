import { apiClient } from "@/api/api-client";

const ACCESS_TOKEN_KEY = "access_token";

export function getAccessToken(): string | undefined {
	const token = localStorage.getItem(ACCESS_TOKEN_KEY);
	return token ?? undefined;
}

export function setAccessToken(token: string): void {
	localStorage.setItem(ACCESS_TOKEN_KEY, token);
	// Ensure API apiClient sends the token on secured routes
	apiClient.setConfig({
		auth: () => getAccessToken(),
	});
}

export function clearAccessToken(): void {
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	apiClient.setConfig({ auth: undefined });
}

export function isAuthenticated(): boolean {
	return Boolean(getAccessToken());
}

// Initialize apiClient auth on app startup
export function initializeApiClientAuth(): void {
	apiClient.setConfig({
		baseURL: "/api",
		auth: () => getAccessToken(),
	});
}
