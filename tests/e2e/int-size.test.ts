import { expect, test } from "@playwright/test"
import {setup} from "./_helpers";

test('int size -> input to be focused on page enter', async ({ page }) => {
    await setup(page, '/int');
    await expect(page.getByTestId('int-size-input')).toBeFocused();
});

test('int size -> input labels showing/hiding when needed', async ({ page }) => {
    await setup(page, '/int');
    await expect(page.getByTestId('int-size-input-valid-label')).not.toBeVisible();
    await expect(page.getByTestId('int-size-input-label')).toBeVisible();
    await page.getByTestId('int-size-input').fill('42');
    await expect(page.getByTestId('int-size-input-valid-label')).toBeVisible();
    await expect(page.getByTestId('int-size-input-label')).not.toBeVisible();
});

test('int size -> invalid label to appear with invalid input', async ({ page }) => {
    await setup(page, '/int');
    await expect(page.getByTestId('int-size-input-invalid-label')).not.toBeVisible();
    await page.getByTestId('int-size-input').fill('invalid number');
    await expect(page.getByTestId('int-size-input-invalid-label')).toBeVisible();
});