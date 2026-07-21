const MathJs = require('mathjs');

/**
 * isEmpty - function to check object is empty or not
 * 
 * @param {*} obj 
 * @returns
 * @author Amit Verma<amitverma@gloubussoft.in>
 */
const objectIsEmpty = obj => obj && Object.keys(obj).length === 0;

/**
 * @class Evaluator
 * @author Amit Verma<amitverma@globussoft.in>
 */
class Evaluator {
    /**
     * _removeSpaceFromExpr - remove spaces from expr
     * 
     * @param {*} expr 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    _removeSpaceFromExpr(expr) {
        try {
            return expr.replace(/\s/g, '');
        } catch (err) {
            throw err;
        }
    }

    /**
     * _replacePercentSignWithValue - replace percentage sign with values = *0.01
     * 
     * @param {*} expr 
     * @returns 
     * @author Amit Verma<amitverma@gloubssoft.in>
     */
    _replacePercentSignWithValue(expr) {
        try {
            return expr.replace(/\%/g, '*0.01');
        } catch (err) {
            throw err;
        }
    }

    /**
     * _removeSpaceFromVariableValue - remove spaces from variables values keys
     * 
     * @param {*} exprVariableValues 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    _removeSpaceFromVariableValue(exprVariableValues = {}) {
        try {
            let resultObjWithoutSpaceInKey = {};

            if (objectIsEmpty(exprVariableValues)) return resultObjWithoutSpaceInKey;

            for (const [key, value] of Object.entries(exprVariableValues)) {
                resultObjWithoutSpaceInKey[key.replace(/\s/g, '').toLowerCase()] = value;
            }

            return resultObjWithoutSpaceInKey;
        } catch (err) {
            throw err;
        }
    }

    /**
     * isValidExpression - function to validate expression
     *  
     * @param {*} expr 
     * @returns 
     * @author Amit Verma<amitverma@gloubussoft.in>
     */
    isValidExpression(expr) {
        try {
            MathJs.parse(this._replacePercentSignWithValue(expr));
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * evaluate - function to evaluate 
     * 
     * @param {*} expr 
     * @param {*} exprVariableValues 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    evaluate(expr, exprVariableValues = {}) {
        try {
            if (!expr.length || !this.isValidExpression(expr)) return null;
            expr = this._removeSpaceFromExpr(this._replacePercentSignWithValue(expr));

            if (!objectIsEmpty(exprVariableValues)) {
                exprVariableValues = this._removeSpaceFromVariableValue(exprVariableValues);
            }
            return MathJs.evaluate(expr.toLowerCase(), exprVariableValues);
        } catch (err) {
            throw err;
        }
    }
}

module.exports.Evaluator = new Evaluator;