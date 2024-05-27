# Steam Game Scrapper

> This is a demo

This script allows you to grab **basic** information about **any game** on Steam.

## How to use && extras

**General**

- [x] AutoPilot

- [x] Saving data in MongoDB

**Scrapped Info**

- [x] The link for the game

- [x] The title

- [x] The main game image

- [x] The game discount if there is any

- [x] The discount original price

- [x] The final price

- [x] The game price if there is no discount

- [x] 20 Keywords about the game

- [x] Google description about the game

- [x] Wikipedia link

- [x] Extra description from steam

- [x] The game DLCS

- [x] The dlcs name

- [x] The dlcs discount price if there is any

- [x] The dlcs discount original price

- [x] The final discount price

- [x] The dlcs price if there is no discount

- [x] 19 extra images about the game

- [x] 1 video about the game

- [x] The system requirements for the game

- [x] The minimum requirements

- [x] The recommended requirements

**The final json**

```
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
```

**How to use**

1. Clone the project

2. Open a terminal inside and write the following command

```
npm install
```

3. Create a .env file and write down your MongoDB URI (Mongo Atlas)

```
URI={YOUR_MONGODB_URI}
```

> [!NOTE]
> Extra notes

You will see:

```
const startPoint = 55;
const endPoint = 1020;
```

The **startPoint** is the starting steam page that you want to scrape from.

The **endPoint** is the last steam page that you want to scrape from.

You will see this function:

```
const autoScroll = async (page) => {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 2000;
            const distance = 8500;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
};
```

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

Unfortunately this feature won't work for some reason, so what you need to do is when the browser opens, you'll go to the steam pages first and grab the game urls, what you want to do is start scrolling very quickly to the bottom to load more content and more content.

In the **getGamesLinks** function you will see **await timeout(15000)**, you will have 15 seconds to scroll as fast as possible to load more content, if you want more time just increase the seconds.

## Contact me

If there is any problem with the script, please contact me on Discord: **charonhim**
