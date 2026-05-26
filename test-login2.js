const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Interceptar TODOS los requests
  page.on('request', req => {
    if (req.url().includes('api') || req.url().includes('health')) {
      console.log(`📤 REQUEST: ${req.method()} ${req.url()}`);
    }
  });
  
  page.on('response', async res => {
    if (res.url().includes('api') || res.url().includes('health')) {
      const status = res.status();
      let body = '';
      try {
        body = await res.text().catch(() => '');
        if (body.length > 500) body = body.substring(0, 500) + '...';
      } catch (e) {}
      console.log(`📥 RESPONSE: ${status} ${res.url()}`);
      if (body) console.log(`   Body: ${body}`);
    }
  });
  
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  try {
    console.log('🌐 Navegando al login...');
    await page.goto('https://frontend-1lru6hzt3-thenecioia-6783s-projects.vercel.app/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('✅ Página cargada');
    
    const emailField = await page.locator('input[type="email"]').first();
    const passwordField = await page.locator('input[type="password"]').first();
    const submitButton = await page.locator('button[type="submit"]').first();
    
    console.log('📝 Llenando credenciales...');
    await emailField.fill('admin@rifassan.com');
    await passwordField.fill('Admin2026!');
    
    console.log('🖱️ Haciendo clic en login...');
    await submitButton.click();
    
    console.log('⏳ Esperando 15 segundos...');
    await page.waitForTimeout(15000);
    
    const url = page.url();
    console.log('📍 URL actual:', url);
    
    await page.screenshot({ path: 'login-result2.png', fullPage: true });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: 'login-error2.png', fullPage: true });
  }
  
  await browser.close();
})();
