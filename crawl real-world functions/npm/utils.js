const esprima = require("esprima");

const {Syntax} = esprima;

function getStandaloneIdentifiers(node) {
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
    }
    return possibleIds
        .filter(Boolean)
        .filter(node => node.type === Syntax.Identifier);
}

function allChildNodes(root) {
    let currentLevel = [root];
    let collectedNodes = [];
    while(currentLevel.length) {
        currentLevel = getChildNodes(currentLevel);
        collectedNodes = currentLevel.concat(collectedNodes);
    }
    return collectedNodes;
}

function getChildNodes(parents) {
    return parents
        .filter(Boolean)
        .reduce((acc, parent) => [
            ...acc,
            ...Object.values(parent)
        ], [])
        .reduce((acc, value) => [
            ...acc,
            ...Array.isArray(value)
                ? value
                : [value]
        ], [])
        .filter(value => value && value.type);
}

module.exports = { getStandaloneIdentifiers, allChildNodes };

const code = `import jQuery from "../core.js";
import stripAndCollapse from "../core/stripAndCollapse.js";
import rnothtmlwhite from "../var/rnothtmlwhite.js";

import "../core/init.js";

function getClass( elem ) {
	return elem.getAttribute && elem.getAttribute( "class" ) || "";
}

function classesToArray( value ) {
	if ( Array.isArray( value ) ) {
		return value;
	}
	if ( typeof value === "string" ) {
		return value.match( rnothtmlwhite ) || [];
	}
	return [];
}

jQuery.fn.extend( {
	addClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( typeof value === "function" ) {
			return this.each( function( j ) {
				jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		classes = classesToArray( value );

		if ( classes.length ) {
			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( typeof value === "function" ) {
			return this.each( function( j ) {
				jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		if ( !arguments.length ) {
			return this.attr( "class", "" );
		}

		classes = classesToArray( value );

		if ( classes.length ) {
			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );

				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {

						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		if ( typeof value === "function" ) {
			return this.each( function( i ) {
				jQuery( this ).toggleClass(
					value.call( this, i, getClass( this ), stateVal ),
					stateVal
				);
			} );
		}

		if ( typeof stateVal === "boolean" ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		return this.each( function() {
			var className, i, self, classNames;

			// Toggle individual class names
			i = 0;
			self = jQuery( this );
			classNames = classesToArray( value );

			while ( ( className = classNames[ i++ ] ) ) {

				// Check each className given, space separated list
				if ( self.hasClass( className ) ) {
					self.removeClass( className );
				} else {
					self.addClass( className );
				}
			}
		} );
	},

	hasClass: function( selector ) {
		var className, elem,
			i = 0;

		className = " " + selector + " ";
		while ( ( elem = this[ i++ ] ) ) {
			if ( elem.nodeType === 1 &&
				( " " + stripAndCollapse( getClass( elem ) ) + " " ).indexOf( className ) > -1 ) {
				return true;
			}
		}

		return false;
	}
} );`

//const result = allChildNodes(esprima.parseModule(code, {range:true}));
