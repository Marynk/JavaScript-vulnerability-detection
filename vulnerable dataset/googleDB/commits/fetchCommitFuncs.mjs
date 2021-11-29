import fs from "fs";
import { getFunctions } from "./processCommit.mjs";

const commits = JSON.parse(fs.readFileSync(process.argv[2]).toString()); // input the result from processLinks for googleDB

for (const obj of commits) {
    const apiReq = obj.link.replace("github.com/", "api.github.com/repos/")
        .replace(/\/pull\/\d*\/commits\//, "/commits/")
        .replace("/commit/", "/commits/");
    console.log(apiReq);
    const relevantFiles = obj?.relevantFiles
        .map((file) => file.slice(1));

    const {files, errors} = await getFunctions(apiReq, relevantFiles);
    console.log(files);
    console.log(errors);

    obj.files = files;
    obj.errors = errors;
}

fs.writeFileSync(process.argv[3], JSON.stringify(commits, null, 2)); // output dataset of vulnerable and fixed functions for each googleDB vulnerable entry