const puppeteer = require("puppeteer");

async function filterFollowers(
  instagramUsername,
  instagramPassword,
  followingThreshold
) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Login
    await page.goto("https://www.instagram.com/accounts/login/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', instagramUsername);
    await page.type('input[name="password"]', instagramPassword);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Navigate to your profile
    await page.goto(`https://www.instagram.com/${instagramUsername}/`, {
      waitUntil: "domcontentloaded",
    });

    // Click on followers
    await page.waitForSelector(
      'a[href="/' + instagramUsername + '/followers/"]'
    );
    await page.click('a[href="/' + instagramUsername + '/followers/"]');
    await page.waitForSelector('div[role="dialog"]');

    // Scroll to load all followers
    let previousHeight;
    while (true) {
      previousHeight = await page.evaluate(
        "document.querySelector(\"div[role='dialog']\").scrollHeight"
      );
      await page.evaluate(
        "document.querySelector(\"div[role='dialog']\").scrollTo(0, document.querySelector(\"div[role='dialog']\").scrollHeight)"
      );
      await page.waitForFunction(
        `document.querySelector("div[role='dialog']").scrollHeight > ${previousHeight}`
      );
      await page.waitForTimeout(1000); // Optional: add a short delay for smoother scrolling
      const newHeight = await page.evaluate(
        "document.querySelector(\"div[role='dialog']\").scrollHeight"
      );
      if (newHeight === previousHeight) {
        break;
      }
    }

    // Get followers
    const followersHandles = await page.$$('div[role="dialog"] ul > div > li');
    const filteredFollowers = [];
    for (const followerHandle of followersHandles) {
      const followerUsername = await followerHandle.$eval(
        "div > div > div > div > div > a",
        (el) => el.innerText
      );
      const followerFollowingCount = await getFollowingCount(
        page,
        followerHandle
      );
      if (followerFollowingCount > followingThreshold) {
        filteredFollowers.push({
          username: followerUsername,
          followingCount: followerFollowingCount,
        });
      }
    }

    // Print or return the filtered followers
    console.log(filteredFollowers);
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

async function getFollowingCount(page, followerHandle) {
  const followerProfileLink = await followerHandle.$eval(
    "div > div > div > div > div > a",
    (el) => el.href
  );
  await page.goto(followerProfileLink, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("ul li:nth-child(3) span");
  const followingCountText = await page.$eval(
    "ul li:nth-child(3) span",
    (el) => el.innerText
  );
  return parseInt(followingCountText.replace(/,/g, ""), 10);
}

// Replace these with your Instagram credentials and desired following threshold
const instagramUsername = "rumchh_sw";
const instagramPassword = "brunocm641";
const followingThreshold = 1500;

filterFollowers(instagramUsername, instagramPassword, followingThreshold);
