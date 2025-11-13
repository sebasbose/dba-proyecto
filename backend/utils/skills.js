import { getSkillsList } from "../services/mysql.js";

export function extractSkills(text) {
  if (!text) return [];

  const textLower = text.toLowerCase();
  const skillsList = getSkillsList();
  const foundSkills = [];

  for (const skill of skillsList) {
    const skillLower = skill.name.toLowerCase();
    const regex = new RegExp(
      `\\b${skillLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i",
    );
    if (regex.test(textLower)) {
      foundSkills.push(skill);
    }
  }

  return foundSkills;
}
