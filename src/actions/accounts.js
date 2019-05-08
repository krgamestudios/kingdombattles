export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';

export function login(id, email, username, token) {
	return {
		type: LOGIN,
		id: id,
		email: email,
		username: username,
		token: token
	};
}

export function logout() {
	return {
		type: LOGOUT
	};
}
