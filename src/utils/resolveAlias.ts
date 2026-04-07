export function resolveAlias(
  importPath: string,
  aliases: Record<string, string>,
): string {
  // Sort by length descending so longest prefix matches first
  const sortedAliases = Object.keys(aliases).sort(
    (a, b) => b.length - a.length,
  );

  for (const alias of sortedAliases) {
    // Match "alias/" or "alias" at start of path
    if (importPath === alias) {
      return aliases[alias];
    }
    const prefix = alias + "/";
    if (importPath.startsWith(prefix)) {
      return aliases[alias] + "/" + importPath.slice(prefix.length);
    }
  }

  return importPath;
}
