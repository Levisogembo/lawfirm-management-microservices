import * as crypto from "crypto";

export async function generateRandomPassword(length: number = 12): Promise<string> {
  // Define allowed characters
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+[]{}|;:,.<>?";

  const allChars = upper + lower + numbers + symbols;

  let password = "";

  // Ensure at least one char of each type
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    const randomIndex = crypto.randomInt(0, allChars.length);
    password += allChars[randomIndex];
  }

  // Shuffle to remove predictable order
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
