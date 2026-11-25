document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("inventra_token")) { location.href="/dashboard"; return; }
  const form = document.getElementById("loginForm");
  const error = document.getElementById("loginError");
  const password = document.getElementById("password");
  document.getElementById("togglePassword").addEventListener("click", () => {
    password.type = password.type === "password" ? "text" : "password";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); error.textContent = "";
    const button = document.getElementById("loginSubmit");
    button.disabled = true; button.querySelector("span").textContent = "Signing in...";
    try {
      const body = new URLSearchParams();
      body.set("username", document.getElementById("username").value.trim());
      body.set("password", password.value);
      const response = await fetch("/auth/login", {
        method:"POST",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to sign in.");
      localStorage.setItem("inventra_token", data.access_token);
      try {
        const me = await API.get("/auth/me");
        localStorage.setItem("inventra_user", JSON.stringify(me));
      } catch (_) { localStorage.setItem("inventra_user", JSON.stringify({username:document.getElementById("username").value,role:"staff"})); }
      location.href="/dashboard";
    } catch (err) { error.textContent = err.message; }
    finally { button.disabled = false; button.querySelector("span").textContent = "Sign in"; }
  });
});
