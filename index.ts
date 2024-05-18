import * as puppeteer from 'puppeteer';

const url = 'https://store.steampowered.com/app/227300/Euro_Truck_Simulator_2/'

const runMain = async () => {
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    await page.goto(url)

    const title = await page.$eval('.apphub_AppName', el => el.innerHTML)
    
    const minRequirements = await page.$eval('.game_area_sys_req_leftCol', el => {
        const items = el.querySelector('.bb_ul')?.querySelectorAll('li');
        if(!items) {
            return [];
        }
        return Array.from(items, item => item.textContent?.trim());
    });
   

    console.log('The Title: ' + title)
    console.log(minRequirements)

    browser.close()
}

runMain()