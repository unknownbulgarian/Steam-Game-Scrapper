const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');

require('dotenv').config();

const uri = process.env.URI
const dbName = 'Games';
const collectionName = 'sources';

//put the url of the targetted game
const url = 'https://store.steampowered.com/app/271590/Grand_Theft_Auto_V/'

//you can add delay between the actions
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));

}

//example 
/*await timeout(3000)*/


const runMain = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        // userDataDir: './data', 
        executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
    })
    const page = await browser.newPage()
    await page.goto(url)

    await timeout(4000)


    //getting the link for the game
    const newUrl = page.url()

    //getting the title of the game
    const title = await page.$eval('.apphub_AppName', el => el.innerHTML)

    //getting the main image
    const imgSrc = await page.$eval('.game_header_image_full', el => el.getAttribute('src'))

    //getting extra images for the game
    const extraImages = await page.evaluate(() => {
        const imageDiv = document.querySelectorAll('.screenshot_holder')
        const links = Array.from(imageDiv).map(el => el.querySelector('a').getAttribute('href'))
        return links;
    })

    //getting extra videos for the game
    const extraVideos = await page.evaluate(() => {
        const videos = document.querySelectorAll('.highlight_player_item')
        const links = Array.from(videos).map(el => el.getAttribute('src'))
        return links;
    })

    //getting extra description for the game
    const extraDescription = await page.$eval('.game_description_snippet', el => {
        const description = el.textContent.trim()
        return description
    })

    //getting the keywords for the game
    const keywords = await page.$eval('.popular_tags', el => {
        const words = Array.from(el.querySelectorAll('a')).map(el => el.textContent.trim())
        return words;
    })

    //getting the minimum requirements for the game (if there is any)

    const minRequirements = await page.evaluate(() => {

        const items = document.querySelector('.game_area_sys_req_leftCol')
        if (!items) {
            return [];
        } else {
            const theItems = items.querySelector('.bb_ul')?.querySelectorAll('li');
            return Array.from(theItems, item => item.textContent?.trim());
        }

    })

    //getting the recommended requirements for the game (if there is any)

    const recommendedRequirements = await page.evaluate(() => {
        try {
            const items = document.querySelector('.game_area_sys_req_rightCol')
            if (!items) {
                return [];
            } else {
                const theItems = items.querySelector('.bb_ul')?.querySelectorAll('li');
                return Array.from(theItems, item => item.textContent?.trim());
            }
        } catch (error) {
            return [];
        }

    })

    //getting single requirements (if there is any)

    const requirements = await page.evaluate(() => {
        try {
            const items = document.querySelector('.game_area_sys_req_full')
            if (!items) {
                return [];
            } else {
                const theItems = items.querySelector('.bb_ul')?.querySelectorAll('li');
                return Array.from(theItems, item => item.textContent?.trim());
            }
        } catch (error) {
            return [];
        }
    })


    //getting the gameDLCS if there are any
    const gameDLCS = await page.evaluate(() => {
        try {
            const el = document.querySelector('.game_area_dlc_list');
            if (!el) throw new Error('Element not found');

            const dlsNames = Array.from(el.querySelectorAll('.game_area_dlc_name')).map(el => el.innerHTML?.trim());
            const prices = Array.from(el.querySelectorAll('.game_area_dlc_price')).map(el =>
                Array.from(el.querySelectorAll('.discount_prices')).map(el => Array.from(el.querySelectorAll('.discount_final_price')).map(el => el.textContent)));

            return {
                dls: dlsNames,
                dlsPrices: prices
            };
        } catch (error) {
            console.error('Error occurred while fetching game DLCs:', error);
            return null;
        }
    });

    //getting the game price
    const gamePrice = await page.evaluate(() => {
        try {
            const price = document.querySelector('.game_purchase_price')
            if (!price) {
                return null;
            } else {
                return price.textContent.trim()
            }

        } catch (error) {
            return null;
        }
    })

    const FinalPrice = await page.evaluate(() => {
        try {
            const price = document.querySelector('.discount_final_price')
            if (!price) {
            return null
            } else {
                return price.textContent.trim()
            }

        } catch (error) {
            return null
        }
    })



    await page.goto('https://www.google.bg/search?q=' + title + '&lr=lang_en')


    //getting the main description for the game
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

    const game = {
        General: {
            Link: newUrl,
            Title: title,
            imgSrc: imgSrc,
            GamePrice: gamePrice,
            FinalPrice,
            Keywords: []
        },
        About: {
            Description: description?.desc,
            Wikipedia: description?.wikiLink,
        },
        Extra: {
            Description: extraDescription,
            DLCS: [],
            Images: [],
            Videos: [],
        },
        Requirements: {
            Requirements: [],
            Minimum: [],
            Maximum: [],
        },
    };

    if (gameDLCS && gameDLCS.dls && gameDLCS.dlsPrices) {
        for (let i = 0; i < gameDLCS.dls.length; i++) {
            const dlcName = gameDLCS.dls[i];
            const dlcPrices = gameDLCS.dlsPrices[i] || [];

            const dlcPrice = dlcPrices[0] || null;
            game.Extra.DLCS.push({ name: dlcName, price: dlcPrice });
        }
    }

    if (minRequirements) {
        for (let i = 0; i < minRequirements.length; i++) {
            const req = minRequirements[i]
            game.Requirements.Minimum.push({ Req: req })
        }
    }

    if (recommendedRequirements) {
        for (let i = 0; i < recommendedRequirements.length; i++) {
            const req = recommendedRequirements[i]
            game.Requirements.Maximum.push({ Req: req })
        }
    }

    if (requirements) {
        for (let i = 0; i < requirements.length; i++) {
            const req = requirements[i]

            game.Requirements.Requirements.push({ req })
        }
    }

    for (let i = 0; i < extraImages.length; i++) {
        const image = extraImages[i]
        game.Extra.Images.push({ image })
    }

    for (let i = 0; i < extraVideos.length; i++) {
        const video = extraVideos[i]
        game.Extra.Videos.push({ video })
    }

    for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i]
        game.General.Keywords.push({ keyword })
    }



    const client = new MongoClient(uri);
    await client.connect();

    try {
        const db = client.db(dbName);
        const collection = db.collection(collectionName);


        await collection.updateOne(
            { _id: '664892cd5c515863eae2e6c9' },
            { $push: { games: game } },
            { upsert: true }
        );

        console.log('Game data inserted successfully into the "games" array in the MongoDB document.');
    } finally {
        await client.close();
        browser.close();
    }

}

runMain()