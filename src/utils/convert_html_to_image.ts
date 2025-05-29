import puppeteer from 'puppeteer';

export async function convertHtmlToImage(html: string): Promise<Uint8Array> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set viewport to a larger size for better quality
        await page.setViewport({
            width: 1200,
            height: 600,
            deviceScaleFactor: 4 // Higher resolution multiplier
        });

        // Set content
        await page.setContent(html, {
            waitUntil: ['networkidle0', 'domcontentloaded']
        });

        // Wait for fonts and images to load
        await page.evaluateHandle('document.fonts.ready');

        // Take screenshot with enhanced quality settings
        const screenshot = await page.screenshot({
            type: 'jpeg',
            fullPage: true,
            omitBackground: true,
            path: undefined, // Don't save to file, return buffer
            quality: 100 // Maximum quality
        });

        return screenshot;
    } finally {
        await browser.close();
    }
}

export async function generatePDF(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        return Buffer.from(pdfBuffer);
    } catch (error) {
        console.error("generatePDF error:", error);
        throw error;
    } finally {
        await browser.close();
    }
}