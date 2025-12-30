import { expect, test } from "@playwright/test"
import {setup} from "./_helpers";

test('base -> loads useless home page', async ({ page }) => {
    await setup(page, '/');
    await expect(page.getByAltText('Logo')).toBeVisible();
});

test('base -> shows correct 404 layout', async ({ page }) => {
    await setup(page, '/not-found', false);
    await new Promise(resolve => setTimeout(resolve, 250));
    await expect(page.getByAltText('Logo')).toBeVisible();
    await expect(page.getByTestId('error-status-code')).toHaveText('404');
});

test('base -> dark mode is loading no flash script', async ({ page }) => {
    await setup(page, '/');
    await expect(page.getByTestId('dark-mode-no-flash-script')).toBeAttached();
});

