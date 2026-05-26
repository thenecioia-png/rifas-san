const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capturar console logs
  const logs = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    logs.push(text);
    console.log(text);
  });
  
  page.on('pageerror', err => {
    const text = `[PAGE ERROR] ${err.message}`;
    logs.push(text);
    console.log(text);
  });

  try {
    console.log('🌐 Navegando al login...');
    await page.goto('https://frontend-1lru6hzt3-thenecioia-6783s-projects.vercel.app/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('✅ Página cargada');
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    
    // Verificar si hay campos de login
    const emailField = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordField = await page.$('input[type="password"], input[name="password"]');
    const submitButton = await page.$('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login")');
    
    console.log('Email field found:', !!emailField);
    console.log('Password field found:', !!passwordField);
    console.log('Submit button found:', !!submitButton);
    
    if (!emailField || !passwordField) {
      console.log('❌ No se encontraron campos de login. Tomando screenshot...');
      await page.screenshot({ path: 'login-error.png', fullPage: true });
      await browser.close();
      return;
    }
    
    console.log('📝 Llenando credenciales...');
    await emailField.fill('admin@rifassan.com');
    await passwordField.fill('Admin2026!');
    
    console.log('🖱️ Haciendo clic en login...');
    await submitButton.click();
    
    // Esperar resultado
    console.log('⏳ Esperando respuesta...');
    await page.waitForTimeout(10000);
    
    const url = page.url();
    console.log('📍 URL actual:', url);
    
    await page.screenshot({ path: 'login-result.png', fullPage: true });
    
    // Buscar mensajes de error
    const errorMsg = await page.$eval('[role="alert"], .error, .text-danger, .text-red', el => el.textContent).catch(() => null);
    if (errorMsg) {
      console.log('🚨 Mensaje de error en página:', errorMsg);
    }
    
    console.log('\n📋 RESUMEN DE LOGS:');
    logs.forEach(l => console.log(l));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: 'login-error.png', fullPage: true });
  }
  
  await browser.close();
})();
