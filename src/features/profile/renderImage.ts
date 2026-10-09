import type { PublicProfile } from "./profile";
import { profileSections } from "./ProfileCard";

function fittedText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let clipped = text;
  while (clipped && ctx.measureText(`${clipped}…`).width > maxWidth) clipped = clipped.slice(0, -1);
  return `${clipped}…`;
}

export async function renderProfileImage(profile: PublicProfile, format: "png" | "jpeg"): Promise<Blob> {
  const sections = profileSections(profile);
  const height = 550 + sections.reduce((sum, section) => sum + 100 + Math.ceil(section.names.length / 2) * 36, 0);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = Math.max(780, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image export is unavailable in this browser.");

  ctx.fillStyle = "#f6f5f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#b9c8bc";
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 44, 1112, canvas.height - 88);
  ctx.fillStyle = "#235c49";
  ctx.font = "24px Arial";
  ctx.fillText("✧  A T L A S   /   A  P E R S O N A L  M A P", 86, 112);
  ctx.fillStyle = "#18201e";
  ctx.font = "58px Georgia";
  ctx.fillText(fittedText(ctx, profile.name ? `${profile.name}'s atlas` : "A personal atlas", 1020), 86, 210);
  ctx.fillStyle = "#68736e";
  ctx.font = "21px Arial";
  ctx.fillText("A simple record of the places chosen for this profile.", 86, 260);

  let y = 340;
  for (const section of sections) {
    ctx.strokeStyle = "#cdd8ce";
    ctx.beginPath();
    ctx.moveTo(86, y - 28);
    ctx.lineTo(1114, y - 28);
    ctx.stroke();
    ctx.fillStyle = "#235c49";
    ctx.font = "bold 22px Arial";
    ctx.fillText(section.title.toUpperCase(), 86, y);
    ctx.textAlign = "right";
    ctx.fillText(`${section.names.length} / ${section.total}`, 1114, y);
    ctx.textAlign = "left";
    y += 56;
    ctx.fillStyle = "#26312c";
    ctx.font = "20px Arial";
    if (!section.names.length) {
      ctx.fillText("No visited places included.", 86, y);
      y += 36;
    } else {
      section.names.forEach((name, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        ctx.fillText(fittedText(ctx, `•  ${name}`, 470), 86 + col * 520, y + row * 36);
      });
      y += Math.ceil(section.names.length / 2) * 36;
    }
    y += 42;
  }
  ctx.fillStyle = "#68736e";
  ctx.font = "17px Arial";
  ctx.fillText("Shared by choice · No visit dates or location traces", 86, canvas.height - 88);
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image export failed.")), `image/${format}`, 0.92));
}
