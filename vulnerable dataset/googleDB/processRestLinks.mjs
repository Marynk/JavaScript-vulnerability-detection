import fs from "fs";
import DomParser from "dom-parser";
import fetch from "node-fetch";
const parser = new DomParser();

const links = JSON.parse(fs.readFileSync(process.argv[2]).toString()); // result from crawlLinks if chosen the second table with raw entries 

const objs = []

async function main(){
    for(const link of links){
        try{
        const resp = await fetch(link)
                    .then(res => res.text());
        const html = parser.parseFromString(resp);
        const trs = html.getElementsByTagName("tr");


        // ------ look for relevant links ------ //
        let relevantLinks = trs.filter(tr => tr.innerHTML.includes("Links"))?.[0]
                                    ?.getElementsByTagName("td")?.[1]
                                    ?.getElementsByTagName("a")
                                    ?.map(el => el.getAttribute("href"))
        
                                    relevantLinks = relevantLinks ? Array.from(relevantLinks) : "";
                                    
        
        // ------ get CVE number ------ //
        const cve = link.split("/").pop();
        
        // ------ get info on package and versions ------ //
        const details = html.getElementsByClassName("col-sm-12")[0].textContent;

        // ------ possibly get CWE, deffinitely get type of vulnerability ------ //
        const vulnType = decodeURIComponent(trs.filter(tr => tr.innerHTML.includes("Type"))?.[0]?.getElementsByTagName("td")?.[1]?.textContent);
        // console.log(type)

        objs.push({
            page: link,
            CVE : cve,
            vulnType, 
            details,
            relevantLinks
        });
        // console.log(objs);
    }catch(e){
        console.log(e)
        console.log("problem with the link: ", link)
    }

    }
    fs.writeFileSync(process.argv[3], JSON.stringify(objs, null, 2)) // resulting dataset of any information on vulnerable entries from the second table
}

main()