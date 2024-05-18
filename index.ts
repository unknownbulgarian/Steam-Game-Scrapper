import * as puppeteer from 'puppeteer';

const url = 'https://store.steampowered.com/app/227300/Euro_Truck_Simulator_2/'

function timeout(ms: any) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const runMain = async () => {
    const browser = await puppeteer.launch({ 
        headless: false, 
        userDataDir: './data', 
        executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe' 
    })
    const page = await browser.newPage()
    await page.goto(url)

    const title = await page.$eval('.apphub_AppName', el => el.innerHTML)


    const minRequirements = await page.$eval('.game_area_sys_req_leftCol', el => {
        const items = el.querySelector('.bb_ul')?.querySelectorAll('li');
        if (!items) {
            return [];
        }
        return Array.from(items, item => item.textContent?.trim());
    });

    const recommendedRequirements = await page.$eval('.game_area_sys_req_rightCol', el => {
        const items = el.querySelector('.bb_ul')?.querySelectorAll('li');
        if (!items) {
            return [];
        }
        return Array.from(items, item => item.textContent?.trim());
    })

    await page.goto('https://www.google.bg/search?q=' + title + '&lr=lang_en')

    await timeout(7000)

    const description = await page.$eval('.kno-rdesc', el => {
        const descParent = el.querySelector('span')
        if (descParent !== null) {
            const descChild = descParent.querySelector('span')
            return descChild?.innerText;
        } else {
            return null;
        }
    })



    console.log('The Title: ' + title)
    console.log(minRequirements)
    console.log(recommendedRequirements)
    console.log('Description: ' + description)

    browser.close()
}

runMain()