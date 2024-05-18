import * as puppeteer from 'puppeteer';

const url = 'https://store.steampowered.com/category/action/'

const runMain = async () => {
    const browser  = await puppeteer.launch({headless: false})
    const page = await browser.newPage()
    await page.goto(url)

    browser.close()
}

runMain()