import { ref } from "vue";

type ToastType = "success" | "error";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    timeoutId: number;
}

export const toasts = ref<Toast[]>([]);

function addToast(message: string, type: ToastType): void {
    const id = crypto.randomUUID();

    const timeoutId = window.setTimeout(() => {
        const index = toasts.value.findIndex((t) => t.id === id);
        toasts.value.splice(index, 1);
    }, 5000);

    toasts.value.push({id, message, type, timeoutId});
}

export function dismissToast(id: string): void {
    const index = toasts.value.findIndex((t) => t.id === id);
    const toast = toasts.value[index];
    toasts.value.splice(index, 1);

    window.clearTimeout(toast!.timeoutId);
}

export function success(message: string): void {
    addToast(message, "success");
}

export function error(message: string): void {
    addToast(message, "error");
}