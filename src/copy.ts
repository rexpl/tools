import {error, success} from "./toasts";

export async function copyValueToClipboard(value: string, message: string = 'Value copied to clipboard.'): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(value);
        success(message);
        return true;
    } catch (e) {
        console.log(e);
        error('Copy to clipboard not failed.');
        return false;
    }
}