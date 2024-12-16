const fs = require("fs").promises;
const path = require("path");

const MAX_NEW_ADDITIONS = 5;

async function compareAndAppend() {
  try {
    const dataPath = path.join(process.cwd(), "data");
    const publicPath = path.join(process.cwd(), "public");

    // Create directories if they don't exist
    await Promise.all([
      fs.mkdir(dataPath, { recursive: true }),
      fs.mkdir(publicPath, { recursive: true }),
    ]);

    // Read all necessary files
    const oldData = await fs
      .readFile(path.join(dataPath, "sanitized-list.json"), "utf8")
      .then(JSON.parse)
      .catch(() => []);

    const newData = await fs
      .readFile(path.join(dataPath, "sanitized-list-temp.json"), "utf8")
      .then(JSON.parse);

    let existingNewAdditions = [];
    try {
      existingNewAdditions = JSON.parse(
        await fs.readFile(path.join(dataPath, "new-additions.json"), "utf8")
      );
    } catch (error) {
      console.log("Creating new additions file...");
    }

    const oldTitles = new Set(oldData.map((movie) => movie["original-title"]));
    const newAdditions = newData.filter(
      (movie) => !oldTitles.has(movie["original-title"])
    );

    if (newAdditions.length === 0) {
      console.log("No new movies found.");
      return;
    }

    console.log(`Found ${newAdditions.length} new movies:\n`);
    newAdditions.forEach((movie, index) => {
      console.log(`${index + 1}. Original Title: "${movie["original-title"]}"`);
      console.log(`   Sanitized Title: "${movie["sanitized-title"]}"`);
      console.log(`   Year: ${movie.year}`);
      console.log(`   Quality: ${movie.quality}`);
      console.log(`   Size: ${movie.size}`);
      if (movie.keywords.length > 0) {
        console.log(`   Keywords: ${movie.keywords.join(", ")}`);
      }
      console.log("");
    });

    const updatedNewAdditions = [
      ...newAdditions.reverse(),
      ...existingNewAdditions,
    ].slice(0, MAX_NEW_ADDITIONS);

    const updatedList = [...oldData, ...newAdditions];

    // Save all files
    await Promise.all([
      fs.writeFile(
        path.join(dataPath, "sanitized-list.json"),
        JSON.stringify(updatedList, null, 2)
      ),
      fs.writeFile(
        path.join(dataPath, "new-additions.json"),
        JSON.stringify(updatedNewAdditions, null, 2)
      ),
      fs.writeFile(
        path.join(publicPath, "sanitized-list.json"),
        JSON.stringify(updatedList, null, 2)
      ),
      fs.writeFile(
        path.join(publicPath, "new-additions.json"),
        JSON.stringify(updatedNewAdditions, null, 2)
      ),
    ]);

    console.log(`\nSuccessfully updated files in all directories`);
    console.log(`\nTotal number of movies in old list: ${oldData.length}`);
    console.log(`Total number of movies in new list: ${newData.length}`);
    console.log(`Number of new additions: ${newAdditions.length}`);
    console.log(
      `Number of items in new-additions.json: ${updatedNewAdditions.length}`
    );

    // Clean up temporary files
    try {
      await Promise.all([
        fs.unlink(path.join(dataPath, "sanitized-list-temp.json")),
        fs.unlink(path.join(dataPath, "raw-data.json")),
      ]);
      console.log("Temporary files deleted successfully");
    } catch (deleteError) {
      console.error("Error deleting temporary files:", deleteError.message);
    }
  } catch (error) {
    console.error("Error comparing files:", error);
    throw error;
  }
}

module.exports = compareAndAppend;
