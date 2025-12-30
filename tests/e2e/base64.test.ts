import { expect, test } from "@playwright/test"
import {setup} from "./_helpers";

test('base64 -> input to be focused on page enter', async ({ page }) => {
    await setup(page, '/base64');
    await expect(page.getByTestId('base64-encoded-input')).toBeFocused();
});