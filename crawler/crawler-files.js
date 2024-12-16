const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");

async function loginAndNavigate() {
  const movieData = [];
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    await page.goto("https://leech.saulie077.workers.dev/", {
      waitUntil: "networkidle2",
    });

    await page.type("#email", "admin");
    await page.type("#password", "admin");
    await page.click("#btn-login");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("Login successful, navigating to movie folder...");

    await page.goto("https://leech.saulie077.workers.dev/0:/", {
      waitUntil: "networkidle2",
    });

    console.log("Successfully navigated to the movie folder!");

    await page.waitForSelector(".list-group-item.list-group-item-action", {
      visible: true,
    });

    console.log("Starting to scroll...");

    let prevContentLength = 0;
    let noChangeCount = 0;

    // Function to get item count - to be executed in browser context
    const getItemCount = () => {
      /* eslint-disable no-undef */
      return document.querySelectorAll(
        ".list-group-item.list-group-item-action"
      ).length;
      /* eslint-enable no-undef */
    };

    // Function to scroll - to be executed in browser context
    const scrollToBottom = () => {
      /* eslint-disable no-undef */
      window.scrollTo(0, document.body.scrollHeight);
      /* eslint-enable no-undef */
    };

    while (noChangeCount < 5) {
      const currentContentLength = await page.evaluate(getItemCount);

      if (currentContentLength === prevContentLength) {
        noChangeCount++;
      } else {
        noChangeCount = 0;
      }

      console.log(
        `Content loaded: ${currentContentLength} items (previously ${prevContentLength}).`
      );

      prevContentLength = currentContentLength;

      await page.evaluate(scrollToBottom);

      await page
        .waitForFunction(
          (prevLength) => {
            /* eslint-disable no-undef */
            const currentLength = document.querySelectorAll(
              ".list-group-item.list-group-item-action"
            ).length;
            /* eslint-enable no-undef */
            return currentLength > prevLength;
          },
          { timeout: 2000 },
          prevContentLength
        )
        .catch(() => {
          console.log("No new content detected after scrolling.");
        });

      if (noChangeCount >= 5) {
        console.log("No more new items. Stopping scroll.");
        break;
      }
    }

    console.log("Reached the end of the page.");

    const divs = await page.$$(".list-group-item.list-group-item-action");

    if (divs.length < 1) {
      console.log("No items found.");
      return;
    }

    for (const div of divs) {
      const originalTitle = await div
        .$eval(".countitems", (el) => el.textContent.trim())
        .catch(() => null);

      const dlurl = await div
        .$eval(".form-check-input", (el) => el.value)
        .catch(() => null);

      const size = await div
        .$eval(".badge", (el) => el.textContent.trim())
        .catch(() => null);

      if (originalTitle && dlurl && size) {
        console.log(
          `Found: "${originalTitle}" with URL: ${dlurl} and size: ${size}`
        );

        movieData.push({
          "original-title": originalTitle,
          url: dlurl,
          size,
        });
      }
    }

    const dataPath = path.join(process.cwd(), "data");
    console.log("Saving data to raw-data.json...");
    await fs.writeFile(
      path.join(dataPath, "raw-data.json"),
      JSON.stringify(movieData, null, 2),
      "utf-8"
    );
    console.log("Data saved to raw-data.json");
  } catch (error) {
    console.error("Error during scraping:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = loginAndNavigate;
