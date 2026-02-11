function extractBasename(fullPath: string): string {
    const lastSlash = fullPath.lastIndexOf('/');
    const lastBackslash = fullPath.lastIndexOf('\\');
    const lastSep = Math.max(lastSlash, lastBackslash);
    return lastSep >= 0 ? fullPath.slice(lastSep + 1) : fullPath;
}

export function getCaller(): string | null {
    const stack = new Error().stack?.split('\n').slice(1);
    if (!stack || stack.length < 2) return null;

    const extractFile = (line: string) =>
        (line.match(/\((.+):\d+:\d+\)/) ?? line.match(/at\s+(.+):\d+:\d+/) ?? line.match(/@(.+):\d+:\d+/))?.[1] ?? null;

    const selfFile = extractFile(stack[0]!);
    if (!selfFile) return null;

    // Collect all internal library files: selfFile (caller.ts) + the first
    // different file in the chain (banana-core.ts). Everything after that
    // belongs to the actual caller.
    const internalFiles = new Set<string>([selfFile]);
    let foundFirstNonSelf = false;

    for (const line of stack.slice(1)) {
        const file = extractFile(line);
        if (!file) continue;
        if (internalFiles.has(file)) continue;

        if (!foundFirstNonSelf) {
            internalFiles.add(file);
            foundFirstNonSelf = true;
            continue;
        }

        const lineNo = line.match(/(\d+):\d+\)?$/);
        if (lineNo) return `${extractBasename(file)}:${lineNo[1]}`;
    }
    return null;
}
