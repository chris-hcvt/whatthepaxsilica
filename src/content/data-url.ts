/** Versioned URL for files in public/data: a new version tag whenever the data changes, so browsers never mix old data with new code. */
export const dataUrl = (path: string) => `${path}?v=${__DATA_V__}`;
