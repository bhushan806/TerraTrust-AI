/**
 * TerraTrust-AI — OpenID Connect (OIDC) Authentication Service
 */

export async function initiateOidcLogin(): Promise<void> {
  const authority = import.meta.env.VITE_OIDC_AUTHORITY;
  const clientId = import.meta.env.VITE_OIDC_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_OIDC_REDIRECT_URI || window.location.origin;

  if (authority && clientId) {
    const authUrl = `${authority}/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email`;
    window.location.href = authUrl;
  } else {
    // Local / Demo mode fallback
    window.location.href = '/';
  }
}
