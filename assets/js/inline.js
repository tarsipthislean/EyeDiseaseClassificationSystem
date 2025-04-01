document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ JavaScript Loaded Successfully");
});

const imageInput = document.getElementById("imageInput");
const predictButton = document.getElementById("predictButton");
const againButton = document.getElementById("againButton");
const resultsContainer = document.getElementById("resultsContainer");
const cardContainer = document.getElementById("cardContainer");

// เมื่อผู้ใช้เปลี่ยนไฟล์ (เลือกภาพ)
imageInput.addEventListener("change", (e) => {
  const files = e.target.files;

  if (files.length > 10) {
    alert("ไม่สามารถอัปโหลดเกิน 10 ไฟล์ได้");
    imageInput.value = "";
    cardContainer.style.display = "none";
    predictButton.style.display = "none";
    againButton.style.display = "none";
    resultsContainer.innerHTML = "";
    return;
  }

  if (files.length > 0) {
    cardContainer.style.display = "block";
    predictButton.style.display = "inline-block";
    againButton.style.display = "none";
    resultsContainer.innerHTML = "";

    // สร้างการ์ด Preview
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type;

      if (fileType !== "image/jpeg") {
        alert("รองรับเฉพาะไฟล์ JPG เท่านั้น");
        window.location.reload(); // รีเฟรชหน้าเว็บเมื่อผู้ใช้กด OK
        return;
      }

      const containerDiv = document.createElement("div");
      containerDiv.className = "image-container";

      const cardHeader = document.createElement("div");
      cardHeader.className = "image-container-header";
      cardHeader.innerHTML = `
              <i class="fa fa-image"></i>
              <span>ภาพที่ ${i + 1}</span>
          `;
      containerDiv.appendChild(cardHeader);

      const cardBody = document.createElement("div");
      cardBody.className = "image-container-body";

      const imgElement = document.createElement("img");
      imgElement.className = "preview";
      imgElement.src = URL.createObjectURL(file);
      imgElement.addEventListener("click", () => openModal(imgElement.src)); // เปิด modal เมื่อคลิกที่ภาพ
      cardBody.appendChild(imgElement);

      const resultDiv = document.createElement("div");
      resultDiv.className = "result";
      resultDiv.innerHTML = `<h3 class="result-title">ผลลัพธ์การทำนาย</h3>`;
      cardBody.appendChild(resultDiv);

      containerDiv.appendChild(cardBody);
      resultsContainer.appendChild(containerDiv);
    }
  } else {
    imageInput.value = "";
    cardContainer.style.display = "none";
    predictButton.style.display = "none";
    againButton.style.display = "none";
    resultsContainer.innerHTML = "";
  }
});

// ฟังก์ชันเปิด modal
function openModal(imageSrc) {
  const modal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  modalImage.src = imageSrc;
  modal.style.display = "flex"; // เปิด modal
}

// ฟังก์ชันปิด modal
function closeModal() {
  const modal = document.getElementById("imageModal");
  modal.style.display = "none"; // ปิด modal
}

// เมื่อกดปุ่ม 'ทำนายภาพที่เลือก'
predictButton.addEventListener("click", () => {
  const files = imageInput.files;
  if (!files || files.length === 0) {
    alert("กรุณาเลือกไฟล์ภาพก่อน!");
    return;
  }

  // ซ่อนปุ่มเลือกไฟล์
  document.querySelector('label[for="imageInput"]').style.display = "none";

  // Loop เรียก API กับแต่ละไฟล์
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const containerDiv = resultsContainer.children[i];
    const resultDiv = containerDiv.querySelector(".result");
    resultDiv.innerHTML = "<p>กำลังทำนาย...</p>";
    processFile(file, resultDiv);
  }

  againButton.style.display = "inline-block";
});

// เมื่อกดปุ่ม 'ทำอีกครั้ง'
againButton.addEventListener("click", () => {
  if (confirm("คุณต้องการออกจากหน้านี้ใช่ไหม?")) {
    imageInput.value = "";
    cardContainer.style.display = "none";
    predictButton.style.display = "none";
    againButton.style.display = "none";
    resultsContainer.innerHTML = "";
    document.querySelector('label[for="imageInput"]').style.display =
      "inline-block";
  }
});

// ฟังก์ชันประมวลผลไฟล์จริง (เรียก API)
async function processFile(file, resultElement) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(
      "  https://88af-202-29-14-126.ngrok-free.app/predict",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.predictions && data.predictions.length > 0) {
      resultElement.innerHTML = generateResultHTML(data.predictions[0]);
    } else {
      resultElement.innerHTML =
        '<p style="color:red;">ไม่พบผลลัพธ์จากโมเดล</p>';
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    resultElement.innerHTML = `<p style="color:red;">เกิดข้อผิดพลาด: ${error.message}</p>`;
  }
}

// ** แสดงผลลัพธ์ในรูปแบบ Progress Bar **
function generateResultHTML(predictions) {
  const classNames = {
    cataract: "ต้อกระจก",
    diabetic_retinopathy: "เบาหวานขึ้นจอประสาทตา",
    glaucoma: "ต้อหิน",
    normal: "ปกติ",
  };

  let resultsHTML = "";

  let maxIndex = 0;
  let maxValue = predictions[0];

  const englishNames = [
    "cataract",
    "diabetic_retinopathy",
    "glaucoma",
    "normal",
  ];
  for (let i = 0; i < predictions.length; i++) {
    const classKey = englishNames[i];
    const className = classNames[classKey] || "ไม่ทราบชื่อโรค";
    const percent = (predictions[i] * 100).toFixed(2);

    resultsHTML += `
      <div class="mb-3">
        <strong>${className}</strong>
        <div class="progress mt-1">
          <div class="progress-bar"
            role="progressbar"
            style="width: ${percent}%;"
            aria-valuenow="${percent}" 
            aria-valuemin="0" 
            aria-valuemax="100">
            ${percent}%
          </div>
        </div>
      </div>
    `;

    if (predictions[i] > maxValue) {
      maxValue = predictions[i];
      maxIndex = i;
    }
  }

  return `
    <h3 class="result-title">ผลลัพธ์การทำนาย</h3>
    ${resultsHTML}
  `;
}
