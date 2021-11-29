import esprima from "esprima";
import { allChildNodes, getStandaloneIdentifiers } from "./utils.mjs";

const {Syntax} = esprima;
// This function does not recurse on its own
export function renameVars(functionBodyNode, ignoreIds = []) {
    const declaredIds = getVarDeclaredIds(functionBodyNode)
        .concat(getParamIds(functionBodyNode))
        .filter(id => !ignoreIds.includes(id));
    const standaloneIdentifiers = getStandaloneIdentifiers(functionBodyNode)
        .filter(id => !ignoreIds.includes(id));

    return declaredIds.map(decl => [
        decl,
        ...standaloneIdentifiers.filter(id => id.name === decl.name),
    ]);
}

// This function does not recurse on its own
export function renameConstLet(blockNode, ignoreIds = []) {;
    const declaredIds = getConstDeclaredIds(blockNode)
        .filter(id => !ignoreIds.includes(id));
    const standaloneIdentifiers = getStandaloneIdentifiers(blockNode)
        .filter(id => !ignoreIds.includes(id));

    return declaredIds.map(decl => [
        decl,
        ...standaloneIdentifiers.filter(id => id.name === decl.name),
    ]);
}

function getVarDeclaredIds(node) {
    const children = allChildNodes(node);
    const varDeclarators = children
        .filter(child =>
            child.type === Syntax.VariableDeclaration &&
            child.kind === "var"
        )
        .reduce((acc, declaration) => acc.concat(declaration.declarations), []);
    const functionDeclarators = children
        .filter(child => child.type === Syntax.FunctionDeclaration);
    return varDeclarators.concat(functionDeclarators)
        .map(decl => decl.id)
        .filter(Boolean);
}

function getConstDeclaredIds(node) {
    const children = allChildNodes(node);
    const constLetDeclarators = children
        .filter(child =>
            child.type === Syntax.VariableDeclaration &&
            child.kind !== "var"
        )
        .reduce((acc, declaration) => acc.concat(declaration.declarations), []);
    return constLetDeclarators
        .map(decl => decl.id)
        .filter(Boolean);
}

function getParamIds(node) {
    return (node.params || [])
        .map(param => param.left || param)
        .filter(param => param.type === Syntax.Identifier);
}