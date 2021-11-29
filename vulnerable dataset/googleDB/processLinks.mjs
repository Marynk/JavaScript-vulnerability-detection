import fs from "fs";
import DomParser from "dom-parser";
import fetch from "node-fetch";
const parser = new DomParser();

const links = JSON.parse(fs.readFileSync(process.argv[2]).toString()); // result from crawlLinks if chosen the first table with detailed entries 

const objs = []

async function main(){
    for(const link of links){
        try{
        const resp = await fetch(link)
                    .then(res => res.text());
        const html = parser.parseFromString(resp);
        const trs = html.getElementsByTagName("tr");


        // ------ look for js files in related files ------ //
        const relevantFiles = Array.from(
                                    trs.filter(tr => tr.innerHTML.includes("Relevant file/s"))[0]
                                    .getElementsByTagName("td")[1].innerHTML.matchAll(/\.\/\S*/g))
                                    .map(el => el[0])
        const jsFiles = relevantFiles.filter(file => (file.includes(".js") || file.includes(".mjs") || file.includes(".jsx")) 
                                            && (!file.includes(".jsp") || !file.includes(".json")))

        if(!jsFiles.length){ continue }
        console.log(jsFiles)

        // ------ get github link ------ //
        const patchLink = trs.filter(tr => tr.innerHTML.includes("First patch"))[0]
                         .getElementsByTagName("a")[0].getAttribute("href")
        
        // ------ get CVE number ------ //
        const cve = link.split("/").pop();
        
        // ------ get info on package and versions ------ //
        const details = html.getElementsByClassName("col-sm-12")[0].textContent;

        // ------ possibly get CWE, deffinitely get type of vulnerability ------ //
        const vulnType = decodeURIComponent(trs.filter(tr => tr.innerHTML.includes("Type"))[0]
                    .getElementsByTagName("td")[1].textContent);

        objs.push({
            link: patchLink,
            name: "GithHub Commit",
            page: link,
            CVE : cve,
            vulnType,
            details,
            relevantFiles: jsFiles
        });
    }catch(e){
        console.log("problem with the link: ", link)
    }

    }
    fs.writeFileSync(process.argv[3], JSON.stringify(objs, null, 2)) // resulting dataset of github commit links and details of googleDB vulnerable entries
}

main()