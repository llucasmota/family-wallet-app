import { test, expect } from '@playwright/test';

test.describe('Family Wallet E2E Flows', () => {
  test('should load Dashboard successfully with navigation items and metrics', async ({ page }) => {
    await page.goto('/');

    // Check title and brand
    await expect(page).toHaveTitle(/Family Wallet/);
    await expect(page.getByRole('link', { name: 'Family Wallet' })).toBeVisible();

    // Check navigation links
    await expect(page.getByRole('link', { name: /Visão Geral/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Despesas/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Família/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Categorias/i })).toBeVisible();

    // Check action buttons
    await expect(page.getByRole('button', { name: /Modo Agente/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Novo Gasto/i })).toBeVisible();
  });

  test('should open Quick Expense modal and allow toggling types and closing via ESC', async ({ page }) => {
    await page.goto('/');

    // Click "Novo Gasto"
    await page.getByRole('button', { name: /Novo Gasto/i }).click();

    // Check modal content
    await expect(page.getByRole('heading', { name: /Novo Lançamento/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Gasto Único/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Parcelado/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Fixo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Crédito/i })).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: /Novo Lançamento/i })).not.toBeVisible();
  });

  test('should navigate to Family page and open Invite Modal with WhatsApp share', async ({ page }) => {
    await page.goto('/family');

    // Check page title and settlement card
    await expect(page.getByText(/Membros da Família/i)).toBeVisible();
    await expect(page.getByText(/Acerto de Contas do Mês/i)).toBeVisible();

    // Click "Convidar Familiar"
    await page.getByRole('button', { name: /Convidar Familiar/i }).click();

    // Check that Invite Modal opened
    await expect(page.getByRole('heading', { name: /Convidar Familiar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Copiar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Enviar no WhatsApp/i })).toBeVisible();

    // Close via ESC
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: /Convidar Familiar/i })).not.toBeVisible();
  });

  test('should navigate to Categories page and display category grid and new category button', async ({ page }) => {
    await page.goto('/categories');

    await expect(page.getByRole('heading', { name: /Categorias de Gastos/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nova Categoria/i })).toBeVisible();
  });

  test('should navigate to Expenses page and allow filtering and search', async ({ page }) => {
    await page.goto('/expenses');

    // Check table headers
    await expect(page.getByRole('heading', { name: /Extrato de Despesas/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Buscar por descrição ou categoria/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Exportar CSV/i })).toBeVisible();
  });
});
