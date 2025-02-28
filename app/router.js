import { login } from "./auth/auth.js";
import { PageNotFound } from "./components/Error.js";
import { home } from "./home/home.js";

// Define routes with path keys and corresponding view functions
const routes = {
  "/": async () => await home(),
  "/login": () => login(),
  "/404":() => pageError()
};

// Router function to handle navigation based on the current path
function router() {
  // Get the current path from the URL
  let path = window.location.pathname;
  // Select the view function, default to home if path isn't found
  const viewFunction = routes[path] || routes['/404'];
  viewFunction();
}

const pageError = () => {
  document.getElementById("app").innerHTML = PageNotFound;
  document.querySelector(".btn-home").addEventListener("click",()=>{
    navigateTo("/")
  })
};

// Function to navigate to a new path and update the history
export function navigateTo(path) {
  // Push the new state to the history without reloading the page
  window.history.pushState({}, "", path);
  // Update the view
  router();
}

// Event listener for back/forward navigation
window.addEventListener("popstate", router);

// Event listener for initial page load
window.addEventListener("load", router);

// Add click event listeners to navigation links
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("nav a");
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const path = link.getAttribute("data-path");
      navigateTo(path);
    });
  });
});
