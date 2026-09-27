const path = require("node:path");

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "RocoKingdomWorldGuide",
    icon: path.join(__dirname, "desktop", "assets", "roco-kingdom-world-guide")
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      platforms: ["win32"],
      config: {
        name: "RocoKingdomWorldGuide",
        authors: "Ding-Ding-Projects",
        description: "An offline desktop companion to the independent Roco Kingdom: World field guide.",
        iconUrl: "https://ding-ding-projects.github.io/roco-kingdom-world-guide/assets/favicon.ico",
        exe: "RocoKingdomWorldGuide.exe",
        setupExe: "RocoKingdomWorldGuideSetup.exe",
        setupIcon: path.join(__dirname, "desktop", "assets", "roco-kingdom-world-guide.ico"),
        noMsi: true
      }
    }
  ]
};
