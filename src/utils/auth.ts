import Cookies from 'js-cookie';

const TOKEN_KEY = 'admin_jwt_token';

export const authUtils = {
  getToken: (): string => {
    return Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || '';
  },
  
  setToken: (token: string) => {
    Cookies.set(TOKEN_KEY, token, { expires: 7, secure: true, sameSite: 'strict' });
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  removeToken: () => {
    Cookies.remove(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },
  
  isAuthenticated: (): boolean => {
    return !!authUtils.getToken();
  }
};
