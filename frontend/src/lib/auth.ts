import { client } from "../api/client/client.gen";

const ACCESS_TOKEN_KEY = "access_token";

export function getAccessToken(): string | undefined {
	const token = localStorage.getItem(ACCESS_TOKEN_KEY);
	return token ?? undefined;
}

export function setAccessToken(token: string): void {
	localStorage.setItem(ACCESS_TOKEN_KEY, token);
	// Ensure API client sends the token on secured routes
	client.setConfig({
		auth: () => getAccessToken(),
	});
}

export function clearAccessToken(): void {
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	client.setConfig({ auth: undefined });
}

export function isAuthenticated(): boolean {
	return Boolean(getAccessToken());
}

// Initialize client auth on app startup
export function initializeClientAuth(): void {
	client.setConfig({
		baseURL: "/",
		auth: () => getAccessToken(),
	});
}
