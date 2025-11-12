import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export const loginUser = async (email: string, password: string) => {
  try {
    const res = await axios.post(`${API_BASE}/api/token/`, { email, password });
    return res.data; // { access, refresh, role, center }
  } catch (err) {
    console.error(err);
    throw err;
  }
};
