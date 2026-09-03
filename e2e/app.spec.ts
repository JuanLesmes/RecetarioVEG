import { expect, test, type Page } from '@playwright/test';

async function openFirstRecipe(page: Page) {
  await page.goto('/recetas');
  const firstCard = page.getByTestId('recipe-card').first();
  const title = (await firstCard.locator('.recipe-card__title').innerText()).trim();
  await firstCard.getByRole('link', { name: title }).click();
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  return title;
}

test.describe('Recetario VEG', () => {
  test('la portada carga el catálogo y la búsqueda lleva a resultados', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Recetario VEG/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cocina');
    const total = Number(await page.locator('.stat__value').first().innerText());
    expect(total).toBeGreaterThanOrEqual(100);
    // Sin emojis: toda la iconografía es vectorial.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);

    await page.getByRole('combobox', { name: 'Buscar recetas', exact: true }).fill('tofu');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/recetas\?q=tofu/);
    await expect(page.getByTestId('results-summary')).toContainText('para “tofu”');
    expect(await page.getByTestId('recipe-card').count()).toBeGreaterThan(0);
  });

  test('los filtros se reflejan en la URL y en los resultados', async ({ page }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/recetas');
    if (mobile) await page.getByRole('button', { name: /Filtros/ }).click();
    await page.getByRole('button', { name: 'Vegana', exact: true }).click();
    await expect(page).toHaveURL(/dieta=vegana/);
    await page.getByRole('button', { name: 'Postres', exact: true }).click();
    await expect(page).toHaveURL(/cat=postre/);
    if (mobile) await page.getByTestId('sheet-apply').click();
    const cards = page.getByTestId('recipe-card');
    expect(await cards.count()).toBeGreaterThan(0);
    for (const badge of await page.getByTestId('diet-badge').all()) await expect(badge).toHaveText(/Vegana/);
    await page.getByRole('button', { name: 'Quitar filtro Vegana' }).click();
    await expect(page).not.toHaveURL(/dieta=vegana/);
  });

  test('una receta muestra ingredientes escalables, pasos y acciones', async ({ page }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    const title = await openFirstRecipe(page);
    const ingredients = page.getByTestId('ingredient-list').getByRole('listitem');
    expect(await ingredients.count()).toBeGreaterThanOrEqual(3);
    expect(await page.getByTestId('step-list').getByRole('listitem').count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator('.recipe-hero__visual svg.dish')).toBeVisible();

    const servings = page.getByTestId('servings-value');
    const before = await servings.innerText();
    await page.getByRole('button', { name: 'Más porciones' }).click();
    expect(await servings.innerText()).not.toBe(before);
    await expect(servings).toContainText('original:');

    // En móvil las acciones viven en la barra fija inferior; en escritorio, en la cabecera de la receta.
    const favButton = page.getByTestId(mobile ? 'action-fav' : 'favorite-button');
    const cartButton = page.getByTestId(mobile ? 'action-cart' : 'add-to-shopping');
    await favButton.click();
    await expect(favButton).toHaveAttribute('aria-pressed', 'true');
    await cartButton.click();
    await expect(page.getByRole('status').filter({ hasText: 'agregados a tu lista' })).toBeVisible();

    await page.goto('/favoritos');
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    await page.goto('/lista-de-compras');
    await expect(page.getByTestId('shopping-pending')).toContainText('pendiente');
    // Al marcar un ítem, la lista lo reordena al final: se localiza por su nombre y no por posición.
    const first = page.getByTestId('shopping-list').getByRole('checkbox').first();
    const label = await first.getAttribute('aria-label');
    await first.check();
    await expect(page.getByTestId('shopping-list').getByRole('checkbox', { name: label ?? '' })).toBeChecked();
  });

  test('en móvil la barra de acciones fija abre el modo cocina', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'solo aplica al viewport móvil');
    await openFirstRecipe(page);
    const bar = page.locator('.action-bar');
    await expect(bar).toBeVisible();
    await bar.getByRole('link', { name: 'Modo cocina' }).click();
    await expect(page.getByTestId('cook-mode')).toBeVisible();
  });

  test('el modo cocina navega los pasos con botones y teclado', async ({ page }, testInfo) => {
    await openFirstRecipe(page);
    await page.getByTestId(testInfo.project.name === 'mobile' ? 'action-cook' : 'cook-mode-link').click();
    await expect(page.getByTestId('cook-mode')).toBeVisible();
    const step = page.getByTestId('cook-step-text');
    const first = await step.innerText();
    await page.getByTestId('cook-next').click();
    expect(await step.innerText()).not.toBe(first);
    await page.keyboard.press('ArrowLeft');
    expect(await step.innerText()).toBe(first);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/receta\/[^/]+$/);
  });

  test('la despensa sugiere recetas según los ingredientes que tengo', async ({ page }) => {
    await page.goto('/despensa');
    await expect(page.getByText('Cuéntanos qué tienes')).toBeVisible();
    await page.getByTestId('pantry-input').fill('papa, cebolla, huevo');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('pantry-chips').getByRole('button')).toHaveCount(3);
    await expect(page.getByTestId('pantry-summary')).toContainText('con tus ingredientes');
    const footers = page.getByTestId('match-footer');
    expect(await footers.count()).toBeGreaterThan(0);
    await expect(footers.first()).toContainText('ingredientes');
    await page.reload();
    await expect(page.getByTestId('pantry-chips').getByRole('button')).toHaveCount(3);
  });

  test('desde la portada se puede entrar a la despensa con ingredientes', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('pantry-home-input').fill('garbanzos, tomate');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/despensa$/);
    await expect(page.getByTestId('pantry-chips').getByRole('button')).toHaveCount(2);
  });

  test('el planificador asigna comidas y genera la lista de compras', async ({ page }) => {
    await page.goto('/planificador');
    await page.getByTestId('planner-fill').click();
    await expect(page.getByTestId('planner-summary')).toContainText('21 de 21');
    await page.getByTestId('planner-shopping').click();
    await page.goto('/lista-de-compras');
    const pending = await page.getByTestId('shopping-pending').innerText();
    expect(Number(pending.split(' ')[0])).toBeGreaterThan(21);
    await page.reload();
    await expect(page.getByTestId('shopping-pending')).toHaveText(pending);
  });

  test('el tema oscuro persiste tras recargar', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('las rutas desconocidas muestran una página 404', async ({ page }) => {
    await page.goto('/esto-no-existe');
    await expect(page.getByText('Ups, aquí no hay nada servido')).toBeVisible();
    await page.getByRole('link', { name: 'Explorar recetas' }).click();
    await expect(page).toHaveURL(/\/recetas$/);
  });

  test('la página no tiene scroll horizontal en móvil', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'solo aplica al viewport móvil');
    for (const path of ['/', '/recetas', '/despensa', '/planificador', '/lista-de-compras']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `scroll horizontal en ${path}`).toBeLessThanOrEqual(1);
    }
  });
});
