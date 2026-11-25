const API = {
  token: () => localStorage.getItem("inventra_token"),
  async request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = this.token();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const response = await fetch(path, {...options, headers});
    if (response.status === 401) {
      localStorage.removeItem("inventra_token");
      localStorage.removeItem("inventra_user");
      if (!location.pathname.startsWith("/login")) location.href = "/login";
      throw new Error("Your session has expired. Please sign in again.");
    }
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const detail = data && typeof data === "object" ? (data.detail || data.message) : data;
      throw new Error(detail || `Request failed (${response.status})`);
    }
    return data;
  },
  get(path) { return this.request(path); },
  post(path, body) { return this.request(path, {method:"POST", body:JSON.stringify(body)}); },
  put(path, body) { return this.request(path, {method:"PUT", body:JSON.stringify(body)}); },
  delete(path) { return this.request(path, {method:"DELETE"}); }
};
