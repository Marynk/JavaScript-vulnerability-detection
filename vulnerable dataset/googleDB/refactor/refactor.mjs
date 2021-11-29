import esprima from "esprima";
import { renameConstLet, renameVars } from "./renameVar.mjs";
import { isFunctionNode } from "./utils.mjs";
import { allChildNodes } from "./utils.mjs";

const {Syntax} = esprima;

export function refactor(code, differentNames = true) {

    const root = esprima.parseScript(code, {range: true});
    const identifiers = getIdentifiers(root);

    let replacers = [];

    for(let i = 1; i <= identifiers.length; i++) {
        for(const identifier of identifiers[i-1]){
            replacers.push({"range": identifier.range, "replacer": differentNames ? `varName${i}` : 'varName'});
        }
    }

    const sorted = replacers.sort((a, b) => a.range[0] - b.range[0]);
    const replaced = sorted
        .reduce((acc, id, index) => {
            const nextRangeStart = sorted[index+1]?.range[0] || code.length;
            return acc + id.replacer + code.slice(id.range[1], nextRangeStart);
        }, code.slice(0, sorted[0]?.range[0] || code.length));

    return replaced;
}

function getIdentifiers(root) {
    const children = allChildNodes(root);
    const scopeNodes = children.filter(hasBlockBody);
    const pureBlockNodes = children.filter(node => node.type === Syntax.BlockStatement);

    let renamed = [];
    const ignored = () => renamed.flat();

    // Rename let/const in pure blocks
    for (const block of pureBlockNodes) {
        const newlyRenamed = renameConstLet(block, ignored());
        renamed = renamed.concat(newlyRenamed);
    }

    for (const node of scopeNodes) {
        if (isFunctionNode(node)) {
            renamed = renamed.concat(
                renameVars(node, ignored())
            );
        }
        if (node.type === Syntax.BlockStatement) {
            renamed = renamed.concat(
                renameConstLet(node, ignored())
            );
        } else if (node.body || node.block) {
            renamed = renamed.concat(
                renameVars(node.body || node.block, ignored())
            );
        }
    }

    return renamed;
}

function hasBlockBody(node) {
    return isFunctionNode(node) ||
        [
            Syntax.TryStatement, Syntax.CatchClause, Syntax.WhileStatement, Syntax.IfStatement, Syntax.ForOfStatement, Syntax.ForInStatement, Syntax.ForStatement
        ].includes(node.type);
}