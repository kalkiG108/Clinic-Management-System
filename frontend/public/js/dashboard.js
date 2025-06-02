function loadSection(section) {
  document.getElementById("dashboardContent").innerHTML =
    document.getElementById(section).innerHTML;
  document
    .querySelectorAll(".sidebar .nav-link")
    .forEach((link) => link.classList.remove("active"));
  const link = document.getElementById(section + "Link");
  if (link) link.classList.add("active");
  // Hide sidebar on mobile after click
  if (window.innerWidth < 992) {
    var offcanvas = bootstrap.Offcanvas.getInstance(
      document.getElementById("sidebarOffcanvas")
    );
    if (offcanvas) offcanvas.hide();
  }

  // Special handling for generate bills section
  if (section === 'generateBills') {
    loadPatientsForBilling();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/auth/loginreceptionist";
    return;
  }
  try {
    const response = await fetch("/auth/receptionist-info", {
      headers: { Authorization: token },
    });
    if (response.ok) {
      const data = await response.json();
      document.getElementById("welcomeReceptionist").innerText =
        "Welcome, " + data.receptionistName + "!";
      const mobileWelcome = document.getElementById("welcomeReceptionistMobile");
      if (mobileWelcome) mobileWelcome.innerText = "Welcome, " + data.receptionistName + "!";
    } else {
      window.location.href = "/auth/loginreceptionist";
    }
  } catch (e) {
    window.location.href = "/auth/loginreceptionist";
  }
});

function handleLogout() {
  localStorage.removeItem("token");
  window.location.href = "/";
} 