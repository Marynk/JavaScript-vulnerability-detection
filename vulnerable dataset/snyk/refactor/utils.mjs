import { Syntax } from "espree";

export function getStandaloneIdentifiers(node) {
    const ids = allChildNodes(node)
        .map(standaloneIds)
        .reduce((acc, ids) => acc.concat(ids), []);
    return ids
}
function standaloneIds(node) {
    const possibleIds = [];
    switch (node.type) {
        case Syntax.RestElement:
        case Syntax.SpreadElement:
        case Syntax.UpdateExpression:
        case Syntax.AwaitExpression:
        case Syntax.UnaryExpression:
        case Syntax.YieldExpression:
        case Syntax.ReturnStatement:
            possibleIds.push(node.argument);
            break;
        case Syntax.AssignmentPattern:
        case Syntax.AssignmentExpression:
        case Syntax.BinaryExpression:
        case Syntax.LogicalExpression:
        case Syntax.ForInStatement:
        case Syntax.ForOfStatement:
        case Syntax.ThrowStatement:
            possibleIds.push(node.left, node.right);
            break;
        case Syntax.ConditionalExpression:
            possibleIds.push(node.test, node.consequent, node.alternate);
            break;
        case Syntax.DoWhileStatement:
        case Syntax.IfStatement:
        case Syntax.SwitchCase:
        case Syntax.WhileStatement:
            possibleIds.push(node.test);
            break;
        case Syntax.ForStatement:
            possibleIds.push(node.init, node.test, node.update);
            break;
        case Syntax.ExportSpecifier:
            possibleIds.push(node.local);
            break;
        case Syntax.ExportDefaultDeclaration:
            possibleIds.push(node.declaration);
            break;
        case Syntax.Property:
            possibleIds.push(node.value);
            break;
        case Syntax.ArrowFunctionExpression:
            possibleIds.push(node.body);
            break;
        case Syntax.TaggedTemplateExpression:
            possibleIds.push(node.tag);
            break;
        case Syntax.ExpressionStatement:
            possibleIds.push(node.expression);
            break;
        case Syntax.TemplateLiteral:
        case Syntax.SequenceExpression:
            possibleIds.push(...node.expressions);
            break;
        case Syntax.CallExpression:
        case Syntax.NewExpression:
            possibleIds.push(node.callee, ...node.arguments);
            break;
        case Syntax.SwitchStatement:
            possibleIds.push(node.discriminant);
            break;
        case Syntax.VariableDeclarator:
            possibleIds.push(node.init);
            break;
        case Syntax.WithStatement:
            possibleIds.push(node.object);
            break;
        case Syntax.ArrayPattern:
        case Syntax.ArrayExpression:
            possibleIds.push(...node.elements);
            break;
        case Syntax.MemberExpression:
            if (node.parent.property !== node) {
                possibleIds.push(node.object);
            }
            break;
    }
    return possibleIds
        .filter(Boolean)
        .filter(node => node.type === Syntax.Identifier);
}

export function allChildNodes(root) {
    let currentLevel = [root];
    let collectedNodes = [];
    while(currentLevel.length) {
        currentLevel = getChildNodes(currentLevel);
        collectedNodes = currentLevel.concat(collectedNodes);
    }
    return collectedNodes;
}

export function getChildNodes(parents) {
    return parents
        .filter(Boolean)
        .flatMap((parent) => Object.entries(parent)
            .filter(([key, value]) => key !== 'parent')
            .flatMap(([key, value]) => Array.isArray(value)
                ? value
                : [value]
            )
            .filter(value => value?.type)
            .map(value => ({...value, parent}))
        );
}

export function isFunctionNode(node) {
    return [ Syntax.FunctionExpression, Syntax.ArrowFunctionExpression, Syntax.FunctionDeclaration, Syntax.MethodDefinition ]
        .includes(node.type);
}