function encodePathSpaces(url: string): string {
  const suffixIndex = url.search(/[?#]/);
  if (suffixIndex === -1) {
    return url.replace(/ /g, "%20");
  }

  return `${url.slice(0, suffixIndex).replace(/ /g, "%20")}${url.slice(
    suffixIndex
  )}`;
}

export function normalizeImageUrl(url: string): string {
  let normalizedUrl = url.trim();
  if (!normalizedUrl) return "";

  if (normalizedUrl.startsWith("//")) {
    normalizedUrl = `https:${normalizedUrl}`;
  } else {
    normalizedUrl = normalizedUrl.replace(/^http:\/\//i, "https://");
  }

  const githubBlobMatch = normalizedUrl.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/([^?#]+)([?#].*)?$/i
  );
  if (githubBlobMatch) {
    normalizedUrl = `https://raw.githubusercontent.com/${githubBlobMatch[1]}/${githubBlobMatch[2]}/${githubBlobMatch[3]}/${githubBlobMatch[4]}${githubBlobMatch[5] || ""}`;
  }

  if (
    !normalizedUrl.startsWith("/") &&
    !/^https?:\/\//i.test(normalizedUrl)
  ) {
    normalizedUrl = `/${normalizedUrl}`;
  }

  return encodePathSpaces(normalizedUrl);
}

export function optimizeImage(
  url: string,
  width = 1200,
  output: "jpg" | "webp" = "webp",
  quality = 80
): string {
  if (url.startsWith("/") && !url.startsWith("//")) return url;

  const normalizedUrl = normalizeImageUrl(url);
  if (!/^https?:\/\//i.test(normalizedUrl)) return normalizedUrl;

  return `https://wsrv.nl/?url=${encodeURIComponent(normalizedUrl)}&w=${width}&output=${output}&q=${quality}`;
}
