import { LOGIN } from "../components/Login.js";
import { navigateTo } from "../router.js";

export const login = () => {
  document.getElementById("app").innerHTML = LOGIN;

  const jwToken = localStorage.getItem("jwt");
  if (jwToken) {
    navigateTo("/");
    return;
  }
  console.log(jwToken);

  document
    .querySelector("#login-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      const email = form.get("email");
      const password = form.get("password");
      let base64 = btoa(`${email}:${password}`);

      const res = await fetch("https://learn.zone01oujda.ma/api/auth/signin", {
        method: "POST",
        headers: {
          Authorization: `Basic ${base64}`,
        },
      });
      if (!res.ok) {
        console.log("Login failed");
        document.querySelector(".error-login").textContent =
          "credentials are invalid";
        return;
      }
      let jwt = await res.json();
      if (!jwt) {
        console.log("Login failed");
        document.querySelector(".error-login").textContent =
          "credentials are invalid";
        return;
      }
      localStorage.setItem("jwt", jwt);
      document.querySelector(".error-login").textContent = "";
      navigateTo("/");
      return;
    });
};
