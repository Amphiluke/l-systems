export const clipboardSupported = !!navigator.clipboard;

export function copy(text) {
    if (clipboardSupported) {
        return navigator.clipboard.writeText(text);
    }
    return Promise.reject("Clipboard API is not supported in this browser");
}
