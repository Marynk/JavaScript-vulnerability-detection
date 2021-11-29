import fs from "fs";


const data = JSON.parse(fs.readFileSync(process.argv[2])); // vulnerable functions dataset, that needs to be filtered

const filtered = data.filter(obj => !obj.fileLink.match(/spec.js|\/specs?\/|test/))  // filter out test files
                    .filter(obj => obj.function.length >= 50)   // filter out functions with less than 50 symbols
                    .map(obj => {  // filter out cases, where affected and fixed functions are the same (i.e. no change in function)
                        const filteredFiles = obj.files.map(file => {
                            const filteredFuncs = file.affectedFunctions
                                .filter(({vulnerable, fixed}) => vulnerable.replace(/\s/g, "") !== fixed.replace(/\s/g, ""));
                            return {
                                ...file,
                                affectedFunctions: filteredFuncs
                            };
                        });
                        return {...obj, files: filteredFiles};
                    })


fs.writeFileSync(process.argv[3], JSON.stringify(filtered, null, 2)); // resulting filtered vulnerable functions dataset