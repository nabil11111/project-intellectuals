const fs = require("fs").promises;
const path = require("path");

function sanitizeMovieTitle(movie) {
  const title = movie["original-title"];
  const movieData = {
    "original-title": title,
    "sanitized-title": "",
    year: "",
    quality: "",
    size: movie.size,
    url: movie.url,
    keywords: [],
  };

  if (!/\.(mkv|mp4|mov)$/i.test(title)) {
    return null;
  }

  const yearMatch = title.match(/\b(20|19)\d{2}\b/);
  if (yearMatch) {
    movieData.year = yearMatch[0];
  }

  const qualityMatch = title.match(/\b(1080p|720p|2160p)\b/);
  if (qualityMatch) {
    movieData.quality = qualityMatch[0];
  }

  const possibleKeywords = [
    "REMUX",
    "BluRay",
    "UNTOUCHED",
    "HDR10",
    "IMAX",
    "Hallowed",
    "REMASTERED",
  ];

  possibleKeywords.forEach((keyword) => {
    if (title.toUpperCase().includes(keyword.toUpperCase())) {
      movieData.keywords.push(keyword);
    }
  });

  movieData.keywords = [...new Set(movieData.keywords)];

  let sanitizedTitle = title.replace(/\.(mkv|mp4|mov)$/i, "");

  sanitizedTitle = sanitizedTitle
    .replace(/\./g, " ")
    .replace(/[[\]()_/]/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  movieData["sanitized-title"] = sanitizedTitle.split(/\d{4}/)[0].trim();

  return movieData;
}

async function saveSanitizedList() {
  try {
    const dataPath = path.join(process.cwd(), "data");
    const rawData = await fs.readFile(
      path.join(dataPath, "raw-data.json"),
      "utf-8"
    );

    const movieDataList = JSON.parse(rawData);
    const sanitizedMovies = [];

    movieDataList.forEach((movie) => {
      const sanitizedMovie = sanitizeMovieTitle(movie);
      if (sanitizedMovie) {
        sanitizedMovies.push(sanitizedMovie);
      }
    });

    await fs.writeFile(
      path.join(dataPath, "sanitized-list-temp.json"),
      JSON.stringify(sanitizedMovies, null, 2)
    );

    console.log("Sanitized list saved to sanitized-list-temp.json");
  } catch (error) {
    console.error("Error in sanitization:", error);
    throw error;
  }
}

module.exports = saveSanitizedList;
