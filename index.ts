import * as puppeteer from 'puppeteer';

const url = 'https://store.steampowered.com/app/227300/Euro_Truck_Simulator_2/'

const runMain = async () => {
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    await page.goto(url)

    const title = await page.$eval('.apphub_AppName', el => el.innerHTML)


    console.log('The Title: ' + title)

    browser.close()
}

runMain()