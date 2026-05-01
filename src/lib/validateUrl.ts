export function validateUrl(url: string): { valid: boolean; error?: string } {
  const trimmed: string = url.trim();

  if (!trimmed) {
    return { valid: false, error: "Please enter your website URL." };
  }

  if (!/^https?:\/\//.test(trimmed)) {
    return {
      valid: false,
      error: "Please include https:// at the start of your URL (e.g. https://yourbusiness.com)",
    };
  }

  const urlRegex: RegExp =
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

  if (!urlRegex.test(trimmed)) {
    return { valid: false, error: "Please enter a valid website URL (e.g. https://yourbusiness.com)" };
  }

  const lowered: string = trimmed.toLowerCase();
  if (lowered.includes("localhost") || lowered.includes("127.0.0.1") || lowered.includes("0.0.0.0")) {
    return { valid: false, error: "That URL cannot be scanned." };
  }

  return { valid: true };
}
