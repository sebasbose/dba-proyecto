export const normalizeRemoteType = (text) => {
  if (!text) return "not_specified";

  const normalized = text.toLowerCase().trim();

  const mapping = {
    remote: "remote",
    hybrid: "hybrid",
    "on-site": "onsite",
    onsite: "onsite",
    office: "onsite",
    "work from home": "remote",
    flexible: "hybrid",
  };

  return mapping[normalized] || "not_specified";
};
