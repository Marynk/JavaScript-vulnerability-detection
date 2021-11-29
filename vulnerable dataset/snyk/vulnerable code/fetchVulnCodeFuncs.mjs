import fs from "fs";
import fetch from "node-fetch";
import * as espree from "espree";
import { allChildNodes } from "../refactor/utils.mjs";
import { isFunctionNode } from "../refactor/utils.mjs";

const vulnCodeLinks = JSON.parse(fs.readFileSync(process.argv[2]).toString())["Vulnerable code"]; // result from snykPages
const regex = /github\.com.*\/raw\/.*#L(\d*)/
async function main(){

    for(const obj of vulnCodeLinks){
        const link = obj.link.replace("blob", "raw");
        console.log(link);
        const lineNum = link.match(regex)?.[1]
        if(!lineNum) {continue}
        // console.log(lineNum)

        //nested functions
        try{
            const functions = await fileToFunctions(link, lineNum)
            obj.files = [{before: {link, affectedFunctions: functions}}]
        }
        catch(e){
            obj.error = e.message;
            console.log(e);
        }
        
    }

    fs.writeFileSync(process.argv[3], JSON.stringify(vulnCodeLinks, null, 2)) // resulting dataset of vulnerable and fixed functions of Vulnerable Code category
}

main()

async function fileToFunctions(fileLink, line) {
    
    const fileText = await fetch(fileLink)
    .then(res => res.text())
    .then(res => {
        if(res.startsWith("#!")){
           return res.split("\n").slice(1).join("\n");
        }
        else if(res.trim().startsWith("<")) throw new Error("file not found")
        else return res;
    });
    
   

    let tree;
    try {
        tree = espree.parse(fileText, {
            loc: true,
            range: true,
            tolerant: true,
            ecmaVersion: 12,
            ecmaFeatures: {
                jsx: true,
                globalReturn: true,
                impliedStrict: false
            },
            sourceType: "script",
        });
    } catch {
        console.log("Failed parsing as a script; trying as a module");
        tree = espree.parse(fileText, {
            loc: true,
            range: true,
            tolerant: true,
            ecmaVersion: 12,
            ecmaFeatures: {
                jsx: true,
                globalReturn: true,
                impliedStrict: false
            },
            sourceType: "module",
        });
    }

    const affectedFunctionNodes = allChildNodes(tree)
        .filter(node => isFunctionNode(node) &&
           (line >= node.loc.start.line && line <= node.loc.end.line)
        );
    return affectedFunctionNodes
        .map(node => fileText.slice(...node.range));
}