async function main() {
  const profile = getStoredProfile();
  const profileForm = document.getElementById("profile");
  if (profile === undefined) {
    profileForm.addEventListener("submit", event => {
      const formData = new FormData(event.target);
      const profile = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        birthDate: formData.get("birthDate"),
        birthCity: formData.get("birthCity"),
        city: formData.get("city"),
        address: formData.get("address"),
        signature: formData.get("signature")
      };

      window.localStorage.setItem("profile", JSON.stringify(profile));
    });

    profileForm.classList.remove("hidden");
  } else {
    document.querySelectorAll("button.reason").forEach(button => {
      button.addEventListener("click", event => {
        handleClick(event.target.id, profile);
      });
    });

    document.getElementById("resetProfile").addEventListener("click", () => {
      window.localStorage.removeItem("profile");
      window.location.reload();
    });

    document.getElementById("buttons").classList.remove("hidden");
  }
}

function getStoredProfile() {
  const profileStr = window.localStorage.getItem("profile");
  if (profileStr === null) {
    return undefined;
  }
  return JSON.parse(profileStr);
}

async function handleClick(reason, profile) {
  const currentDate = new Date();
  const blob = await createAttestation(profile, currentDate, reason);

  downloadBlob(blob, "attestation.pdf");
}

async function createAttestation(profile, currentDate, reason) {
  const response = await fetch("attestation.pdf");
  const bytes = await response.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(bytes);

  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  const dateStr = new Intl.DateTimeFormat("fr").format(currentDate);
  const timeStr = new Intl.DateTimeFormat("fr", { timeStyle: "short" }).format(
    currentDate
  );

  function drawText(text, x, y, { size = 11, pageNumber = 0 } = {}) {
    const page = pdfDoc.getPages()[pageNumber];
    page.drawText(text, {
      x: (x * page.getWidth()) / 826,
      y: (1 - y / 1169) * page.getHeight(),
      size,
      font
    });
  }

  drawText(`${profile.lastName} ${profile.firstName}`, 152, 244);
  drawText(`${profile.birthDate} à ${profile.birthCity}`, 200, 264);
  drawText(`${profile.address} ${profile.city}`, 175, 283);

  switch (reason) {
    case "dog":
      drawText("X", 84, 1010);
      break;
    case "groceries":
      drawText("X", 84, 438, { pageNumber: 1 });
      break;
    case "walk":
      drawText("X", 84, 602, { pageNumber: 1 });
      break;
    default:
      throw new Error(`Unexpected reason ${reason}`);
  }

  drawText(profile.city, 133, 936, { pageNumber: 1 });
  drawText(dateStr, 108, 955, { pageNumber: 1, size: 9 });
  drawText(timeStr, 201, 955, { pageNumber: 1 });
  drawText(profile.signature, 174, 1010, { pageNumber: 1 });

  const result = new Blob([await pdfDoc.save()], { type: "application/pdf" });
  return result;
}

function downloadBlob(blob, fileName) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
}

main();
