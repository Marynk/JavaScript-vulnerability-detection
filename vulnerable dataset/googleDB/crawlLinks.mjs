import fs from "fs";
import fetch from "node-fetch";
import DomParser from "dom-parser";
const parser = new DomParser();


const  initUrl = "https://www.vulncode-db.com/list_entries?keyword=javascript";
const root = "https://www.vulncode-db.com";

// there are 2 tables on googleDB. In the first one, entries have relevant 
// links and info on vulnerability. In the second, there are rest of the entries. 
// Depending on which table needs to be crawled, enter 0 (for the first) and 1 (for the second)
// in the command line, when executing this script AS A SECOND ARGUMENT (first one is an output file).
// By default, the first table is crawled
const whichTable = process.argv[3] ? +process.argv[3] : 0; // note that i didn't implement input sanitation, so it is a responsibility of the script user to input strictly number 0 or 1
const allLinks = [];

async function main(){

    let currentUrl = initUrl;
    while(true) {

            const page = await fetch(currentUrl)
                                .then(res=> res.text());
            
            const tables = parser.parseFromString(page)
                            .getElementById("vulnEntries");

            const firstTable = tables.getElementsByClassName("table-responsive")[whichTable]; 

            if(!firstTable){
                break;
            }

            const links = firstTable.getElementsByClassName("clickable-row")
                        .map(el => root + el.getAttribute("data-href"));

            allLinks.push(...links);

            const nextLink = tables.getElementsByTagName("nav")[1] 
                .getElementsByTagName("a")[1];
            const decoded = nextLink.getAttribute("href")
                .replace("&amp;", "&");
                
            
            if(( root + decoded) === currentUrl) {
                break;
            }
            else{
                currentUrl = root + decoded;
                console.log(currentUrl)
            }
        }

fs.writeFileSync(process.argv[2], JSON.stringify(allLinks, null, 2)); // resulting list of links to vulnerable entries
}





main()