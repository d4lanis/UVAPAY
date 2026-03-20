import { createAuthClient } from "better-auth/client";
import { jwtClient } from "better-auth/client/plugins";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [jwtClient()],
  fetchOptions: {
    credentials: "include",
  },
});
