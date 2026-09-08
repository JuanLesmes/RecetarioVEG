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

  test('se puede subir una receta con el asistente y aparece en "Mis recetas"', async ({ page }) => {
    await page.goto('/mis-recetas/nueva');
    await page.getByTestId('title-input').fill('Arroz con coco de prueba');
    await page.getByTestId('description-input').fill('Arroz dulce y salado al estilo de la costa, para acompañar patacones o pescado vegetal.');
    await page.getByTestId('category-select').selectOption('plato-principal');
    await page.getByTestId('visual-rice').click();

    await page.getByTestId('wizard-next').click();
    const rows = page.getByTestId('ingredient-rows').getByRole('listitem');
    const fill = async (i: number, qty: string, unit: string, name: string) => {
      await rows.nth(i).getByLabel(`Unidad del ingrediente ${i + 1}`).selectOption(unit);
      await rows.nth(i).getByLabel(`Cantidad del ingrediente ${i + 1}`).fill(qty);
      await rows.nth(i).getByLabel(`Nombre del ingrediente ${i + 1}`).fill(name);
    };
    await fill(0, '2', 'taza', 'arroz blanco');
    await fill(1, '400', 'ml', 'leche de coco');
    await fill(2, '2', 'cucharada', 'panela');

    await page.getByTestId('wizard-next').click();
    await page.getByTestId('step-text-0').fill('Cocina la leche de coco 15 minutos hasta que suelte el aceite.');
    await page.getByTestId('step-text-1').fill('Agrega el arroz, la panela y dos tazas de agua; cocina 20 minutos.');
    await page.getByTestId('step-text-2').fill('Deja reposar tapado 10 minutos y sirve.');

    await page.getByTestId('wizard-next').click();
    await page.getByTestId('tip-0').fill('Usa leche de coco de lata para más sabor.');
    await page.getByRole('button', { name: 'tradicional', exact: true }).click();
    await page.getByTestId('estimate-nutrition').click();
    await expect(page.getByTestId('nutrition-calories')).not.toHaveValue('0');

    await page.getByTestId('wizard-next').click();
    await page.getByTestId('save-private').click();
    await expect(page).toHaveURL(/\/mis-recetas$/);
    await expect(page.getByTestId('my-recipes-count')).toContainText('1 receta');
    await page.getByRole('link', { name: 'Arroz con coco de prueba' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Arroz con coco de prueba' })).toBeVisible();
    await expect(page.getByTestId('origin-badge')).toContainText('Tu receta');
  });

  test('la página de cuenta funciona en modo local', async ({ page }) => {
    await page.goto('/cuenta');
    await expect(page.getByRole('heading', { level: 1, name: 'Mi espacio' })).toBeVisible();
    await expect(page.getByTestId('sync-status')).toContainText('Guardado en este dispositivo');
  });

  test('la página no tiene scroll horizontal en móvil', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'solo aplica al viewport móvil');
    for (const path of ['/', '/recetas', '/despensa', '/planificador', '/lista-de-compras', '/mis-recetas/nueva', '/cuenta', '/comunidad']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const result = await page.evaluate(() => {
        const cw = document.documentElement.clientWidth;
        const offenders: string[] = [];
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > cw + 0.5 && r.width > 0 && !el.closest('[class*="chips"], .wizard, .day-tabs, .active-filters, .pantry-cta__hints')) {
            const cls = typeof el.className === 'string' ? el.className.split(' ').slice(0, 2).join('.') : '';
            offenders.push(`${el.tagName.toLowerCase()}.${cls} (${Math.round(r.right - cw)}px)`);
          }
        });
        return { overflow: document.documentElement.scrollWidth - cw, offenders: offenders.slice(0, 5) };
      });
      expect(result.overflow, `scroll horizontal en ${path}: ${result.offenders.join(' | ') || 'sin elementos detectados'}`).toBeLessThanOrEqual(1);
    }
  });
});
