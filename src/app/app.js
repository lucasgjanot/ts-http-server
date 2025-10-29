const { JsonWebTokenError } = require("jsonwebtoken");

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (token) {
        document.getElementById("auth-section").style.display = "none";
        document.getElementById("chirp-section").style.display = "block";
        await getChirps();
    } else {
        document.getElementById("auth-section").style.display = "block";
        document.getElementById("chirp-section").style.display = "none";
    }
});

document.getElementById("chirp-form")
    .addEventListener("submit", async (event) => {
        event.preventDefault();
        await createChirp()
    });

document.getElementById("login-form")
    .addEventListener("submit", async (event) => {
        event.preventDefault();
        await login();
    })

async function createChirp() {
    const body = document.getElementById("chirp-content").value;
    try {
        const res = await fetch("/api/chirp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({body})
        });
        const data = await res.json();
        if (!res.ok) throw new Error(`Failed to create chirp: ${data.error}`);
        const chirpId = data.id;
        if (chirpId) {
            await getChirps();
        }
    } catch {
        alert(`Error: ${error.message}`);
    }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Failed to login: ${data.error}`);
    }

    if (data.token) {
      localStorage.setItem("token", data.token);
      document.getElementById("auth-section").style.display = "none";
      document.getElementById("video-section").style.display = "block";
      await getVideos();
    } else {
      alert("Login failed. Please check your credentials.");
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(`Failed to create user: ${data.error}`);
    }
    console.log("User created!");
    await login();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

function logout() {
  localStorage.removeItem("token");
  document.getElementById("auth-section").style.display = "block";
  document.getElementById("video-section").style.display = "none";
}

async function getChirps() {
  try {
    const res = await fetch("/api/chirps", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(`Failed to get videos. Error: ${data.error}`);
    }

    const chirps = await res.json();
    const chirpsList = document.getElementById("chirps-list");
    chirpsList.innerHTML = "";
    for (const chirp of chirps) {
      const listItem = document.createElement("li");
      listItem.textContent = chirp.body;
      chirpsList.appendChild(listItem);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function getChirp(chirpId) {
  try {
    const res = await fetch(`/api/chips/${chirpId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) {
      throw new Error("Failed to get video.");
    }

    const chirp = await res.json();
    viewChirp(chirp);
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

let currentChirp = null;

function viewChirp(chirp) {
  currentChirp = chirp;
  document.getElementById("chirp-display").style.display = "block";
  document.getElementById("chirp-content-display").textContent =
    chirp.body;
}

async function deletChirp() {
  if (!currentChirp) {
    alert("No chirp selected for deletion.");
    return;
  }

  try {
    const res = await fetch(`/api/chirps/${currentChirp.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) {
      throw new Error("Failed to delete video.");
    }
    alert("Chirp deleted successfully.");
    document.getElementById("chirp-display").style.display = "none";
    await getChirps();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

ocument.getElementById("signup-button").addEventListener("click", signup);
document.getElementById("logout-button").addEventListener("click", logout);