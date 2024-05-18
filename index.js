const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.URI; // Ensure .env file has the MongoDB URI
const dbName = 'Games'; // Your database name
const collectionName = 'sources'; // Your collection name

const startPoint = 0;
const endPoint = 30;

// Function to add delay between actions
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to get game links
const getGamesLinks = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
    });

    const page = await browser.newPage();
    await page.goto('https://store.steampowered.com/search/Steam?sort_by=_ASC&supportedlang=english');

    await page.waitForSelector('.search_result_row');
    const elements = await page.$$('.search_result_row');

    const gamePages = [];
    for (let i = startPoint; i < Math.min(endPoint, elements.length); i++) {
        const url = await elements[i].evaluate(el => el.getAttribute('href'));
        gamePages.push(url);
    }

    await browser.close();
    return gamePages;
};

// Function to scrape game details
const runMain = async (url) => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
    });
    const page = await browser.newPage();
    await page.goto(url);

    await timeout(4000);

    const newUrl = page.url();
    const title = await page.$eval('.apphub_AppName', el => el.innerHTML);
    const imgSrc = await page.$eval('.game_header_image_full', el => el.getAttribute('src'));

    const extraImages = await page.evaluate(() => {
        const imageDiv = document.querySelectorAll('.screenshot_holder');
        return Array.from(imageDiv).map(el => el.querySelector('a').getAttribute('href'));
    });

    const extraVideos = await page.evaluate(() => {
        const videos = document.querySelectorAll('.highlight_player_item');
        return Array.from(videos).map(el => el.getAttribute('src'));
    });

    const extraDescription = await page.$eval('.game_description_snippet', el => el.textContent.trim());

    const keywords = await page.$eval('.popular_tags', el => {
        return Array.from(el.querySelectorAll('a')).map(el => el.textContent.trim());
    });

    const minRequirements = await page.evaluate(() => {
        const items = document.querySelector('.game_area_sys_req_leftCol');
        return items ? Array.from(items.querySelectorAll('li')).map(li => li.textContent.trim()) : [];
    });

    const recommendedRequirements = await page.evaluate(() => {
        const items = document.querySelector('.game_area_sys_req_rightCol');
        return items ? Array.from(items.querySelectorAll('li')).map(li => li.textContent.trim()) : [];
    });

    const requirements = await page.evaluate(() => {
        const items = document.querySelector('.game_area_sys_req_full');
        return items ? Array.from(items.querySelectorAll('li')).map(li => li.textContent.trim()) : [];
    });

    const gameDLCS = await page.evaluate(() => {
        try {
            const el = document.querySelector('.game_area_dlc_list');
            if (!el) throw new Error('Element not found');

            const dlsNames = Array.from(el.querySelectorAll('.game_area_dlc_name')).map(el => el.textContent.trim());

            const originalDiscountPrices = Array.from(el.querySelectorAll('.game_area_dlc_price')).map(el =>
                Array.from(el.querySelectorAll('.discount_prices')).map(el => Array.from(el.querySelectorAll('.discount_original_price')).map(el => el.textContent)));

            const prices = Array.from(el.querySelectorAll('.game_area_dlc_price')).map(el =>
                Array.from(el.querySelectorAll('.discount_prices')).map(el => Array.from(el.querySelectorAll('.discount_final_price')).map(el => el.textContent)));

            const priceDiv = document.querySelector('.game_area_dlc_list');
            const realPrices = Array.from(priceDiv.querySelectorAll('.game_area_dlc_price')).map(el => el.textContent.trim());

            return {
                dls: dlsNames,
                discount: originalDiscountPrices[0].length > 0,
                originalDiscountPrices,
                discountPrice: prices,
                dlcRealPrice: realPrices,
            };
        } catch (error) {
            console.error('Error occurred while fetching game DLCs:', error);
            return null;
        }
    });

    const gamePrice = await page.evaluate(() => {
        try {
            const priceDiv = document.querySelector('.game_area_purchase_game');
            const price = priceDiv.querySelector('.game_purchase_price');
            return price ? price.textContent.trim() : null;
        } catch (error) {
            return null;
        }
    });

    const originalDiscountPrice = await page.evaluate(() => {
        let isDiscount = true;
        try {
            const priceDiv = document.querySelector('.game_area_purchase_game_wrapper');
            const price = priceDiv.querySelector('.discount_original_price');
            return price ? { isDiscount, DiscountOriginalPrice: price.textContent.trim() } : null;
        } catch (error) {
            return null;
        }
    });

    const finalPrice = await page.evaluate(() => {
        try {
            const priceDiv = document.querySelector('.game_area_purchase_game_wrapper');
            const price = priceDiv.querySelector('.discount_final_price');
            return price ? price.textContent.trim() : null;
        } catch (error) {
            return null;
        }
    });

    await page.goto('https://www.google.bg/search?q=' + title + '&lr=lang_en');

    const description = await page.evaluate(() => {
        try {
            const el = document.querySelector('.kno-rdesc');
            const descParent = el.querySelector('span');
            const wiki = el.querySelector('.ruhjFe');

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
            gameDiscount: originalDiscountPrice?.isDiscount,
            GamePrice: gamePrice,
            DiscountOriginalPrice: originalDiscountPrice?.DiscountOriginalPrice,
            FinalPrice: finalPrice,
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

    if (gameDLCS) {
        for (let i = 0; i < gameDLCS.dls.length; i++) {
            const dlcName = gameDLCS.dls[i];

            const originalDiscountPrices = gameDLCS.originalDiscountPrices ? gameDLCS.originalDiscountPrices[i] : null;
            const dlcPrices = gameDLCS.discountPrice ? gameDLCS.discountPrice[i] : null;
            const price = gameDLCS.dlcRealPrice ? gameDLCS.dlcRealPrice[i] : null;

            const dlcPrice = dlcPrices[0] || null;
            game.Extra.DLCS.push({ name: dlcName, discount: gameDLCS.discount, originalDiscountPrices, discountPrice: dlcPrice, price });
        }
    }

    if (minRequirements) {
        for (let i = 0; i < minRequirements.length; i++) {
            const req = minRequirements[i];
            game.Requirements.Minimum.push({ Req: req });
        }
    }

    if (recommendedRequirements) {
        for (let i = 0; i < recommendedRequirements.length; i++) {
            const req = recommendedRequirements[i];
            game.Requirements.Maximum.push({ Req: req });
        }
    }

    if (requirements) {
        for (let i = 0; i < requirements.length; i++) {
            const req = requirements[i];
            game.Requirements.Requirements.push({ req });
        }
    }

    for (let i = 0; i < extraImages.length; i++) {
        const image = extraImages[i];
        game.Extra.Images.push({ image });
    }

    for (let i = 0; i < extraVideos.length; i++) {
        const video = extraVideos[i];
        game.Extra.Videos.push({ video });
    }

    for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        game.General.Keywords.push({ keyword });
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

        console.log(`Game data for ${title} inserted successfully into the "games" array in the MongoDB document.`);
    } finally {
        await client.close();
        browser.close();
    }
};

// Main function to get game links and run the scraping
const main = async () => {
    const gameLinks = await getGamesLinks();
    for (const link of gameLinks) {
        await runMain(link);
    }
};

main();
