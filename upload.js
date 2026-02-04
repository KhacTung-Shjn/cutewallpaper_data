import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import simpleGit from "simple-git";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const IMAGE_DIR = "./images";
const OUTPUT = "wallpapers.json";
const CLOUD_FOLDER = "wallpapers";

const git = simpleGit();

async function uploadAll() {
  const files = fs.readdirSync(IMAGE_DIR).filter(f =>
    !f.startsWith(".") && /\.(jpg|jpeg|png|webp)$/i.test(f)
  );

  const results = [];

  for (const file of files) {
    const filePath = path.join(IMAGE_DIR, file);
    const id = path.parse(file).name;

    console.log("⬆ Uploading:", file);

    const res = await cloudinary.uploader.upload(filePath, {
      folder: CLOUD_FOLDER,
      public_id: id,
      overwrite: false
    });

    results.push({
      id,
      url: res.secure_url,
      category: "cute"
    });
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
  console.log("📄 Generated", OUTPUT);

  await pushToGithub();
}

async function pushToGithub() {
  const remote = `https://${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}.git`;

  await git.addConfig("user.name", "auto-bot");
  await git.addConfig("user.email", "bot@wallpaper.app");

  await git.add(OUTPUT);
  await git.commit("update wallpapers.json");
  await git.push(remote, "main");

  console.log("🚀 Pushed to GitHub");
}

uploadAll();
