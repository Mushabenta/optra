// Optra API helper - shared across all pages.
// Requires api-config.js to be loaded first (sets window.API_BASE_URL).
(function () {
  const BASE =
    window.API_BASE_URL !== undefined
      ? window.API_BASE_URL
      : "http://localhost:5000";

  function token() {
    return localStorage.getItem("optra_token") || "";
  }

  function headers() {
    const h = { "Content-Type": "application/json" };
    const t = token();
    if (t) h.Authorization = "Bearer " + t;
    return h;
  }

  async function request(method, url, body) {
    let res;
    try {
      res = await fetch(BASE + url, {
        method,
        headers: headers(),
        body: body != null ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new Error("Network error. Check the API URL (" + BASE + ").");
    }
    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      data = {};
    }
    if (!res.ok) {
      const err = new Error(data.error || "Request failed");
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "{}");
    } catch (e) {
      return {};
    }
  }

  function setSessionUser(user) {
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      businessId: user.businessId,
      approved: user.approved,
      createdAt: user.createdAt,
      profileImage: user.profileImage || null,
    };
    sessionStorage.setItem("currentUser", JSON.stringify(session));
    localStorage.setItem("currentUser", JSON.stringify(session));
    localStorage.setItem("userRole", session.role);
    localStorage.setItem("userName", session.name);
    localStorage.setItem("userEmail", session.email);
    localStorage.setItem("userBusinessId", session.businessId);
    localStorage.setItem("userApproved", session.approved ? "true" : "false");
    localStorage.setItem("isLoggedIn", "true");
    return session;
  }

  function logoutLocal() {
    [
      "isLoggedIn",
      "currentUser",
      "userRole",
      "userName",
      "userEmail",
      "userBusinessId",
      "userApproved",
      "rememberedLogin",
      "optra_token",
    ].forEach((k) => localStorage.removeItem(k));
    sessionStorage.removeItem("currentUser");
  }

  window.Optra = {
    BASE,
    token,
    getCurrentUser,
    setSessionUser,
    logoutLocal,
    // Generic business-scoped data store
    get: (key) => request("GET", "/api/data/" + key).then((d) => d.value),
    set: (key, value) =>
      request("PUT", "/api/data/" + key, { value }).then((d) => d.value),
    // Users
    me: () => request("GET", "/api/auth/me").then((d) => d.user),
    createInvite: (body) =>
      request("POST", "/api/auth/invites", body || {}).then((d) => d.invite),
    listUsers: () => request("GET", "/api/users").then((d) => d.users),
    updateUser: (id, patch) =>
      request("PATCH", "/api/users/" + id, patch).then((d) => d.user),
    deleteUser: (id) => request("DELETE", "/api/users/" + id),
    myProfile: () => request("GET", "/api/profile").then((d) => d.user),
    saveProfile: (patch) =>
      request("PUT", "/api/profile", patch).then((d) => d.user),
    changePassword: (body) => request("POST", "/api/password/change", body),
    deleteAccount: (body) => request("DELETE", "/api/account", body),
    resetRequest: (identifier) =>
      request("POST", "/api/auth/reset/request", { identifier }),
    resetConfirm: (body) => request("POST", "/api/auth/reset/confirm", body),
  };
})();