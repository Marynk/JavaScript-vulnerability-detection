import fs from "fs";
import { getFunctions } from "./processCommit.mjs";

const commits = JSON.parse(fs.readFileSync(process.argv[2]).toString()) // input the result of "snyk pages"
    .Commit;

for (const obj of commits) {
    const apiReq = obj.link.replace("github.com/", "api.github.com/repos/")
        .replace(/\/pull\/\d*\/commits\//, "/commits/")
        .replace("/commit/", "/commits/");

    const {files, errors} = await getFunctions(apiReq);
    obj.files = files;
    obj.errors = errors;
}

fs.writeFileSync(process.argv[3], JSON.stringify(commits, null, 2)); // output dataset of vulnerable and fixed functions for each snyk vulnerable entry