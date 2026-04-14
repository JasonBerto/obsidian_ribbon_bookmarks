export function basenameFromPath(path: string): string {
  const segment = path.split("/").pop() ?? path;
  return segment.replace(/\.md$/i, "");
}
