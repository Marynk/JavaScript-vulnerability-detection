import fetch from "node-fetch";
import * as espree from "espree";
import { allChildNodes } from "../refactor/utils.mjs";
import { isFunctionNode } from "../refactor/utils.mjs";
import similar from "string-similarity";


async function patchToFunctions(fileLink, patch, countPrefix) {
    const patchLines = patch.split("\n");

    // Lines are 1-indexed
    let currentLine = 0;
    const changedLines = [];
    for (const line of patchLines) {
        if (line.startsWith("@@")) {
            currentLine = line.match(/^@@\s*-(\d*),/)?.[1];
        } else if (line.startsWith(countPrefix)) {
            changedLines.push(currentLine);
            currentLine++;
        }
        else if (line.startsWith(" ")){
            currentLine++;
        }
    }

    const fileText = await fetch(fileLink)
        .then(res => res.text());
    const tree = espree.parse(fileText, {
        loc: true,
        range: true,
        tolerant: true,
        ecmaVersion: 12,
        ecmaFeatures: {
            jsx: true,
            globalReturn: true
        },
        sourceType: "module",
    });
    
    const affectedFunctionNodes = allChildNodes(tree)
        .filter(node => isFunctionNode(node) &&
            changedLines.some(line => line >= node.loc.start.line && line <= node.loc.end.line)
        );
    return affectedFunctionNodes
        .map(node => fileText.slice(...node.range));
}

async function extractAffectedFunctions(file, parentHash) {
    const vulnerableLink = file.raw_url;
    const afterLink = file.raw_url.replace(/raw\/.*?\//, "raw/"+parentHash+"/");

    if (!file.patch) {
        throw new Error("No patch reported by Github");
    }

    const vulnFunctions = await patchToFunctions(vulnerableLink, file.patch, "-");
    const fixedFunctions = await patchToFunctions(afterLink, file.patch, "+");

    const affectedFunctions = vulnFunctions.map(func => {
        const matches = similar.findBestMatch(func, fixedFunctions);
        const bestMatch = matches.bestMatch.rating > 0.6 ?  matches.bestMatch.target : "";

        return {vulnerable: func,
                fixed: bestMatch
                }
    })

    return {"link":vulnerableLink, "fixedLink": afterLink, affectedFunctions} // output, exported to fetchCommitFuncs.mjs
}


export async function getFunctions(apiReq){
    try {
        const fix = await fetch(apiReq, {
            "headers": {
                "Authorization" : "token ----------------------------",  // enter your github API token
                // "Content-type": "application/vnd.github.VERSION.diff",
                "Accept": "application/vnd.github.v3+json"
            },
            "method": "GET",
            "mode": "cors",
            "credentials": "include"
        }).then(r => r.json());

        if (fix.message) {
            throw new Error(fix.message);
        }

        const extracted = await Promise.all(fix.files.map((file) =>
            extractAffectedFunctions(file, fix.parents[0].sha)
                .catch((error) => {
                    console.log(error);
                    return { error };
                })
        ));

        const files = extracted
            .filter(({vulnerable}) => vulnerable?.affectedFunctions.length);
        const errors = extracted
            .map(({error}) => error)
            .filter(Boolean);

        console.log("done");
        return { files, errors };
    } catch (error) {
        return { files: [], errors: [error] };
    }
}

