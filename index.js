import { readFile, writeFile } from "fs/promises";

const BASE_URL = "https://raw.githubusercontent.com/shikijs/textmate-grammars-themes/main/packages";
const devIconsFile = "devicons.json";
const SOURCES = [
    {
        url: `${BASE_URL}/tm-themes/index.js`,
        exportName: "themes",
        outputFile: "themes.json"
    },
    {
        url: `${BASE_URL}/tm-grammars/index.js`,
        exportName: "grammars",
        outputFile: "grammars.json"
    }
];

async function addDeviconsToGrammars(grammarFile, deviconsFile) {
    try {
        const [grammarRaw, deviconsRaw] = await Promise.all([
            readFile(grammarFile),
            readFile(deviconsFile)
        ]);

        const grammars = JSON.parse(grammarRaw);
        const devicons = JSON.parse(deviconsRaw);

        const deviconMap = Object.fromEntries(
            devicons.map(d => [d.name, d.devicon])
                .filter(([_, devicon]) => devicon)
        );

        for (const grammar of grammars) {
            if (deviconMap[grammar.name]) {
                grammar.devicon = deviconMap[grammar.name];
            }
        }

        await writeFile(grammarFile, JSON.stringify(grammars, null, 2));
    } catch (err) {
        console.error(err);
    }
}

async function processSource({ url, exportName, outputFile }) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();
        const match = text.match(new RegExp(`export const ${exportName} = ([\\s\\S]*?)(?=(\\nexport const|$))`));
        if (!match) throw new Error(`Couldn't find "${exportName}"`);

        const dataArray = eval(match[1]);

        await writeFile(outputFile, JSON.stringify(dataArray, null, 2));

        if (exportName === "grammars") {
            addDeviconsToGrammars(`./${outputFile}`, `./${devIconsFile}`);
        }
        
        console.log(`Saved to ${outputFile}`);
    } catch (err) {
        console.error(`Error:`, err.message);
    }
}

await Promise.all(SOURCES.map(processSource));
console.log("Done");
