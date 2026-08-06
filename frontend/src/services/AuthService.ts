import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const loginUser = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  const formData = new URLSearchParams();

  formData.append("username", username);
  formData.append("password", password);

  const response = await axios.post<LoginResponse>(
    `${API_URL}/auth/login`,
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  localStorage.setItem(
    "access_token",
    response.data.access_token
  );

  return response.data;
};

export const logoutUser = (): void => {
  localStorage.removeItem("access_token");
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem("access_token");
};