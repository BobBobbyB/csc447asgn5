// checkPublic.js
import fs from "fs";
import path from "path";

const publicPath = path.resolve("./public/data/student_grades.csv");

if (fs.existsSync(publicPath)) {
  console.log("Found file:", publicPath);
} else {
  console.log("File not found at:", publicPath);
}
