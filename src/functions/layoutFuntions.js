
export function isSmallScreen() {
    if (typeof window !== 'undefined') {
        return window.innerWidth < 978;
    }
    return false;
}