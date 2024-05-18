import * as puppeteer from 'puppeteer';

const url = 'https://store.steampowered.com/app/227300/Euro_Truck_Simulator_2/'

/*function timeout(ms: any) {
    return new Promise(resolve => setTimeout(resolve, ms));
}*/

interface DLC {
    name: string;
    price: (string | null)[];
}

interface Requirements {
    Req: string | undefined;
}


const runMain = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        // userDataDir: './data', 
        executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
    })
    const page = await browser.newPage()
    await page.goto(url)

    const newUrl = page.url()

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

    const gameDLCS = await page.$eval('.game_area_dlc_list', el => {
        const dlsNames = Array.from(el.querySelectorAll('.game_area_dlc_name')).map(el => el.innerHTML?.trim())

        const prices = Array.from(el.querySelectorAll('.game_area_dlc_price')).map(el =>
            Array.from(el.querySelectorAll('.discount_prices')).map(el => Array.from(el.querySelectorAll('.discount_final_price')).map(el => el.textContent)))

        if (dlsNames && prices) {
            return {
                dls: dlsNames,
                dlsPrices: prices
            }
        } else {
            return null;
        }
    })

    const gameReviews = await page.$eval('#game_area_reviews', el => {
        return el.outerHTML;
    })

    const gamePrice = await page.$eval('.discount_original_price', el => {
        return el.textContent
    })


    await page.goto('https://www.google.bg/search?q=' + title + '&lr=lang_en')


    const description = await page.$eval('.kno-rdesc', el => {
        const descParent = el.querySelector('span');
        const wiki = el.querySelector('.ruhjFe');
        try {
            if (descParent) {
                const descChild = descParent.querySelector('span');
                const wikiHref = wiki?.getAttribute('href');
                if (descChild && wikiHref) {
                    return {
                        desc: descChild.innerText.trim(),
                        wikiLink: wikiHref,
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('Error occurred while extracting description:', error);
            return null;
        }
    });



    const finalGame = {
        General: {
            Link: newUrl,
            Title: title,
            GamePrice: gamePrice,
        },
        About: {
            Description: description?.desc,
            Wikipedia: description?.wikiLink,
        },
        Extra: {
            DLCS: [] as DLC[],
        },
        Requirements: {
            Minimum: [] as Requirements[],
            Maximum: [] as Requirements[],
        },
        Reviews: gameReviews,
    };

    if (gameDLCS && gameDLCS.dls && gameDLCS.dlsPrices) {
        for (let i = 0; i < gameDLCS.dls.length; i++) {
            const dlcName = gameDLCS.dls[i];
            const dlcPrices = gameDLCS.dlsPrices[i] || [];
            // Extract the first price as DLC price
            const dlcPrice = dlcPrices[0] || null;
            finalGame.Extra.DLCS.push({ name: dlcName, price: dlcPrice });
        }
    }

    for (let i = 0; i < minRequirements.length; i++) {
        const req = minRequirements[i]

        finalGame.Requirements.Minimum.push({ Req: req })
    }

    for (let i = 0; i < recommendedRequirements.length; i++) {
        const req = recommendedRequirements[i]

        finalGame.Requirements.Maximum.push({ Req: req })
    }




    console.log(finalGame);



    browser.close()
}

runMain()