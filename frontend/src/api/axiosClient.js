import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8000/api",
});

// Runs before EVERY request made with this client. This is what makes
// "attach the token automatically" from our earlier conversation real --
// nobody has to remember to add the header manually anywhere in the app.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;