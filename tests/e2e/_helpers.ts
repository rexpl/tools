import type { Page } from '@playwright/test'

export function setup(page: Page, path: string, withErrorListener: boolean = true) {
    if (withErrorListener) {
        page.on('pageerror', err => {
            throw err;
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                throw new Error(msg.text());
            }
        });
    }

    return goto(page, path);
}

export async function goto(page: Page, path: string) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('__root__').waitFor({ state: 'visible' });
}