const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const marked = require('marked');

/**
 * Gera um PDF a partir de um texto Markdown.
 */
async function gerarPDF(markdown, nomeBase = 'relatorio') {
  // Converter markdown em HTML
  const htmlBody = marked.parse(markdown || '');

  const css = `
    <style>
      body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111; }
      h1,h2,h3 { color: #7d53f3; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
      table, th, td { border: 1px solid #999; }
      th, td { padding: 6px 8px; font-size: 12px; }
      pre { background: #f6f8fa; padding: 8px; overflow-x: auto; }
      code { background: #f6f8fa; padding: 2px 4px; border-radius: 3px; }
    </style>
  `;

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Relatório</title>
        ${css}
      </head>
      <body>
        <div class="container">
          ${htmlBody}
        </div>
      </body>
    </html>
  `;

  // Criar pasta public/pdf se não existir
  const pastaPublic = path.join(__dirname, '../public/pdf');
  fs.mkdirSync(pastaPublic, { recursive: true });

  const fileName = `${nomeBase}_${Date.now()}.pdf`;
  const filePath = path.join(pastaPublic, fileName);

  // 🔥 CAMINHO CORRETO NO AZURE APP SERVICE
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    '/usr/bin/google-chrome';

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote'
    ],
    defaultViewport: { width: 1280, height: 900 }
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });

    return `/public/pdf/${fileName}`;
  } finally {
    await browser.close();
  }
}

module.exports = { gerarPDF };
