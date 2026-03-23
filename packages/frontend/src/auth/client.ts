import { createAuthClient } from "better-auth/client";
import { jwtClient } from "better-auth/client/plugins";
import { API_URL } from "../api/baseUrl";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [jwtClient()],
  fetchOptions: {
    credentials: "include",
  },
});
