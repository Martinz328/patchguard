export interface IUrlValidation {
  isValid: boolean;
  normalizedUrl: string;
  error: string | null;
}

export function validateUrl(input: string): IUrlValidation {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, normalizedUrl: "", error: "Please enter a website address." };
  }

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    if (!parsed.hostname.includes(".")) {
      return { isValid: false, normalizedUrl: "", error: "That doesn't look like a valid website address." };
    }
    return { isValid: true, normalizedUrl: parsed.toString().replace(/\/$/, ""), error: null };
  } catch {
    return { isValid: false, normalizedUrl: "", error: "That doesn't look like a valid website address." };
  }
}
