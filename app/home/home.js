import { HOME } from "../components/Home.js";
import { query } from "../Graphql/graphql.js";
import { createElement } from "../helpers/helpers.js";
import { navigateTo } from "../router.js";

export const home = async () => {
  const jwToken = localStorage.getItem("jwt");
  if (!jwToken) {
    navigateTo("/login");
    return;
  }

  document.getElementById("app").innerHTML = HOME;

  try {
    const data = await fetchUserData(jwToken);
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    const { user, skills, xps, audits } = parseResponse(data);
    renderProfile(user);
    renderSkills(skills);
    renderXPProgress(xps, user.totalXP);
    renderAudits(audits); // Placeholder for future implementation

    document.querySelector(".logout").addEventListener("click", () => {
      localStorage.removeItem("jwt");
      navigateTo("/login");
    });
  } catch (error) {
    console.error("Error:", error.message);
    localStorage.removeItem("jwt");
    navigateTo("/login");
  }
};

async function fetchUserData(jwToken) {
  const headersList = {
    Authorization: `Bearer ${jwToken}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(
    "https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql",
    {
      method: "POST",
      headers: headersList,
      body: JSON.stringify(query),
    }
  );
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  const data = await res.json();
  if (data.errors) {
    throw new Error("GraphQL error: " + data.errors[0].message);
  }
  return data;
}

function parseResponse(responseData) {
  const data = responseData.data;
  const userRaw = data.user[0];
  const user = {
    email: userRaw.email || "N/A",
    lastName: userRaw.lastName || "N/A",
    firstName: userRaw.firstName || "N/A",
    userName: userRaw.login || "N/A",
    totalXP: userRaw.xp?.aggregate?.sum?.amount
      ? Math.round(userRaw.xp.aggregate.sum.amount)
      : 0,
    level: userRaw.level?.[0]?.amount || "N/A",
  };
  const skills = data.skills.map((skill) => ({
    type: skill.type || "Unknown",
    maxAmount:
      skill.transaction_type?.transactions_aggregate?.aggregate?.max?.amount ||
      0,
  }));
  const xps = data.xps
    .map((xp) => ({
      amount: xp.amount || 0,
      time: xp.createdAt ? new Date(xp.createdAt) : new Date(),
    }))
    .sort((a, b) => a.time - b.time);
  const audits = data.audits[0] || {};
  return { user, skills, xps, audits };
}

function renderProfile(user) {
  const profile = document.querySelector(".profile");
  profile.innerHTML = ""; // Clear existing content
  const h1 = createElement(
    "h1",
    "firstName",
    `${user.firstName} ${user.lastName}`
  );
  const username = createElement(
    "p",
    "",
    `Username: <span class="badge">## ${user.userName} ##</span>`
  );
  const email = createElement(
    "p",
    "",
    `Email: <span class="badge">${user.email}</span>`
  );
  const totalXP = createElement(
    "p",
    "",
    `Total XP: <span class="badge">${convertXPToReadable(user.totalXP)}</span>`
  );
  const level = createElement(
    "p",
    "",
    `Level: <span class="badge Level">${user.level}</span>`
  );
  profile.append(h1, username, email, totalXP, level);
}

function renderSkills(skills) {
  const skillsDiv = document.querySelector(".skills");
  skillsDiv.innerHTML = ""; // Clear existing content
  skills.forEach((skill) => {
    const element = createElement(
      "div",
      "skill",
      `${skill.type}: ${skill.maxAmount}%`
    );
    const divColor = createElement("div", "skill-div", "");
    divColor.style.width = `${skill.maxAmount}%`;
    element.append(divColor);
    skillsDiv.append(element);
  });
}

export function convertXPToReadable(xp) {
  if (xp < 1000) {
    return `${xp} B`;
  } else if (xp < 1000000) {
    const kb = (xp / 1000).toFixed(2);
    return `${kb} KB`;
  } else {
    const mb = (xp / 1000000).toFixed(2);
    return `${mb} MB`;
  }
}

function renderXPProgress(xps, totalXP) {
  const xpsDiv = document.querySelector(".xps");
  xpsDiv.innerHTML = ""; // Clear existing content

  if (xps.length === 0 || totalXP === 0) {
    xpsDiv.innerHTML = "<p>No XP events to display.</p>";
    return;
  }

  // Define dimensions
  const padding = 40;
  const fullWidth = 400;
  const fullHeight = 300;
  const plotWidth = fullWidth - 2 * padding; // 320
  const plotHeight = fullHeight - 2 * padding; // 220

  const minTime = xps[0].time.getTime();
  const maxTime = xps[xps.length - 1].time.getTime();
  const timeSpan = maxTime - minTime;

  if (timeSpan === 0) {
    xpsDiv.innerHTML = "<p>All XP events occurred at the same time.</p>";
    return;
  }

  // Create SVG with full dimensions
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", fullWidth);
  svg.setAttribute("height", fullHeight);

  let cumulativeXP = 0;
  const points = xps.map((xp) => {
    cumulativeXP += xp.amount;
    // X: Map time to the plotting width, offset by padding
    const x = padding + ((xp.time.getTime() - minTime) / timeSpan) * plotWidth;
    // Y: Map cumulative XP from bottom (high y) to top (low y) within plotting height
    const y = fullHeight - padding - (cumulativeXP / totalXP) * plotHeight;

    // Dynamic text positioning
    // const offset = 10; // Distance from point to text
    // const minYText = padding; // Keep text below top padding
    const yText = y - 25;
    const xText = x; // Center text on the point

    svg.innerHTML += `
      <text class="text" x="${xText}" y="${yText}" text-anchor="middle" font-family="Arial" font-size="9" fill="white">
          ${convertXPToReadable(xp.amount)}
          <tspan x="${xText}" dy="12">${xp.time.toLocaleDateString()}</tspan>
      </text>

      <circle class="circle" cx="${x}" cy="${y}" stroke="white" stroke-width="0.5" r="2.5" fill="rgba(199, 58, 2, 0.99)"></circle>
    `;
    return `${x},${y}`;
  });

  // Create polyline and fill the area under the curve
  const polyline = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polyline"
  );
  polyline.classList.add("polyline");
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "rgb(59, 65, 121)");
  polyline.setAttribute("stroke-width", "2");
  polyline.setAttribute("points", points.join(" "));
  const H2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
  H2.textContent = `XP progress`;
  H2.setAttribute("x", "20");
  H2.setAttribute("y", "50");
  H2.setAttribute("fill", "rgb(132, 136, 173)");
  H2.setAttribute("font-size", "1em");

  const H4 = document.createElementNS("http://www.w3.org/2000/svg", "text");
  H4.innerHTML = `${xps[0].time.toLocaleDateString()} ==> (${convertXPToReadable(
    xps[0].amount
  )})`;
  H4.setAttribute("x", "20");
  H4.setAttribute("y", `${fullHeight - 10}`); // Position above the bar
  H4.setAttribute("fill", "rgb(200, 215, 255)");
  H4.setAttribute("font-size", "0.8em");

  svg.prepend(H4, polyline, H2);
  xpsDiv.append(svg);
}

const renderAudits = (audits) => {
  const auditsDiv = document.querySelector(".audits");
  // Destructure the audits object
  const { auditRatio, totalUp, totalDown, totalUpBonus } = audits;
  const svgWidth = 300;
  const svgHeight = 200;

  // Calculate the maximum value to scale bars (avoid division by zero)
  const maxValue = Math.max(totalUp, totalDown, 1);
  const upPercentage = ((totalUp + totalUpBonus) / maxValue) * 100; // Percentage for audits done
  const downPercentage = (totalDown / maxValue) * 100; // Percentage for audits received

  // Create SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", svgHeight);

  // Bar for audits done (totalUp)
  const rectUp = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rectUp.setAttribute("width", ((svgWidth - 100) * upPercentage) / 100); // Scale width based on percentage
  rectUp.setAttribute("height", 15);
  rectUp.setAttribute("fill", `${totalUp > totalDown ? "cornflowerblue" : "white"}`);
  rectUp.setAttribute("x", "20");
  rectUp.setAttribute("y", "20");

  // Bar for audits received (totalDown)
  const rectDown = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  rectDown.setAttribute("width", ((svgWidth - 100) * downPercentage) / 100); // Scale width based on percentage
  rectDown.setAttribute("height", 15);
  rectDown.setAttribute("fill", `${totalUp > totalDown ? "white" : "cornflowerblue"}`);
  rectDown.setAttribute("x", "20");
  rectDown.setAttribute("y", "75");

  // Label for audits done
  const textUp = document.createElementNS("http://www.w3.org/2000/svg", "text");
  textUp.textContent = `Audits Done: ${convertXPToReadable(
    totalUp
  )} | Bonus: ${convertXPToReadable(totalUpBonus)}`;
  textUp.setAttribute("x", "20");
  textUp.setAttribute("y", "15"); // Position above the bar
  textUp.setAttribute("fill", `${totalUp > totalDown ? "cornflowerblue" : "white"}`);

  // Label for audits received
  const textDown = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  textDown.textContent = `Audits Received: ${convertXPToReadable(totalDown)}`;
  textDown.setAttribute("x", "20");
  textDown.setAttribute("y", "70"); // Position above the bar
  textDown.setAttribute("fill", `${totalUp > totalDown ? "white" : "cornflowerblue"}`);

  // Label for audits received
  const textRatio = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  textRatio.textContent = `${auditRatio.toFixed(1)}`;
  textRatio.setAttribute("x", "20");
  textRatio.setAttribute("y", "200"); // Position above the bar
  textRatio.setAttribute("fill", "cornflowerblue");
  textRatio.setAttribute("font-size", "7em");

  // Append elements to SVG in order (labels first, then bars)
  svg.append(textUp, rectUp, textDown, rectDown, textRatio);

  // Append SVG to the audits div
  auditsDiv.append(svg);
};
