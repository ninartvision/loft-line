const fs = require("fs");
const path = require("path");

const folderPath = "./"; // შენი პროექტის ფოლდერი

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  const hasBrokenChar = content.includes("�"); // U+FFFD
  const questionMarks = (content.match(/\?/g) || []).length;

  console.log(`\n📄 ${filePath}`);

  if (hasBrokenChar) {
    console.log("❌ აქვს დაზიანებული სიმბოლო (U+FFFD)");
  } else {
    console.log("✅ დაზიანებული სიმბოლო არ აქვს");
  }

  console.log(`❓ ? სიმბოლოების რაოდენობა: ${questionMarks}`);

  if (questionMarks > 3) {
    console.log("⚠️ შესაძლოა ზედმეტი '?' იყოს");
  } else {
    console.log("✅ '?' რაოდენობა ნორმაშია");
  }
}

function scanFolder(folder) {
  const files = fs.readdirSync(folder);

  files.forEach(file => {
    const fullPath = path.join(folder, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanFolder(fullPath);
    } else if (file.endsWith(".html")) {
      checkFile(fullPath);
    }
  });
}

scanFolder(folderPath);