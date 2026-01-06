import {expect, test} from "@playwright/test"
import {setup} from "./_helpers";

test('json -> input to be focused on page enter', async ({page}) => {
    await setup(page, '/json');
    await expect(page.getByTestId('json-encoded-input')).toBeFocused();
});