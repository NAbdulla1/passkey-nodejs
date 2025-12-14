import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

export async function getHealthStatus() {
    const response = await apiClient.get('/health');
    return response.data;
}

export async function loginByPassword(email, password) {
    const response = await apiClient.post('/login-by-password', { email, password });
    return response.data;
}

export async function logout() {
    const response = await apiClient.post('/logout');
    return response.data;
}

export async function isLoggedIn() {
    const response = await apiClient.post('/is-logged-in');
    return response.data;
}

export async function getPassKeyChallenge(email) {
    const response = await apiClient.post('/generate-passkey-challenge', { email });
    return response.data;
}

export async function verifyPassKeyRegistration(userId, passKeyId, attestationResponse, error = false) {
    const response = await apiClient.post('/verify-passkey-registration', { userId, passKeyId, attestationResponse, error });
    return response.data;
}

export async function getPasskeyAuthChallenge(email) {
    const response = await apiClient.post('/generate-authentication-challenge', { email });
    return response.data;
}

export async function verifyPasskeyAuth(userId, passKeyId, assertionResponse, error = false) {
    const response = await apiClient.post('/verify-passkey-authentication', { userId, passKeyId, assertionResponse, error });
    return response.data;
}

/**
 * @returns {Promise<Array[{id: passKey.id, authenticatorName, createdAt: passKey.createdAt, lastUsedAt: passKey.updatedAt}]>} List of registered passkeys for the logged-in user
 */
export async function getPassKeys() {
    const response = await apiClient.get('/passkeys');
    return response.data;
}
