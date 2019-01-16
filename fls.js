const readlineSync = require ('readline-sync');
const fs = require ('fs');

let inputData;
let stack;
let vars;

const readFile = (name) => fs.readFileSync (name, 'utf8');
const charCode = (char) => char.charCodeAt (0);
const charFromCode = String.fromCharCode;

const readChar = () => {
    
    if (inputData.length <= 0) {

        inputData = readlineSync.question () + '\n';
    }

    const res = inputData [0];
    inputData = inputData.substring (1);

    return res;
};

const printChar = (code) => process.stdout.write (charFromCode (code));
const printAsString = (number) => process.stdout.write (number + '');

class StackElement {

    constructor (value) {

        this.value = value;

        switch (typeof value) {

            case 'number':
                this.type = 'number';
                break;
            case 'string':
                this.type = 'function';
                break;
            case 'boolean':
                this.type = 'number';
                this.value = this.value ? 0 : -1;
                break;
        
            default:
                throw new Error (`Unknown data type: ${typeof value}`);
        }
    }
    
    get isFunction () {

        return this.type === 'function';
    }

    get isNumber () {

        return this.type === 'number';
    }

    get isBoolean () {

        return this.type === 'number' && (this.value === 0 || this.value === -1);
    }

    isTrue () {

        return this.type === 'number' && this.value === 0;
    }

    toString () {

        return `{'${this.value}' of ${this.type}}`;
    }
}

let runFile = null;

const stackToString = () => stack.reduce ((acc, val) => acc + val.toString () + '\n', 'Stack: ');

const get = (destory) => {

    if (stack.length === 0) {

        return null;
    }

    const res = stack [stack.length - 1];

    if (destory === true) {

        stack.pop ();
    }

    return res;
};

const push = (element) => {

    if (element === undefined) {

        throw new Error ();
    }

    stack.push (element);
};

const isNumber = (char) => charCode (char) >= charCode ('0') && charCode (char) <= charCode ('9');
const isVar = (char) => charCode (char) >= charCode ('a') && charCode (char) <= charCode ('z');

const processComment = (comment) => {

    const words = comment.split (' ');

    if (words.length === 2 && words [0] === 'USE') {

        runFile (words [1] + '.fls');
    }
};

const execute = (code) => {

    let index = 0;

    let isReadingFunction = false;
    let functionBracketsDifference = 0;
    let func = '';
    
    let isReadingComment = false;
    let commentBracketsDifference = 0;
    let comment = '';

    let isReadingString = false;
    let str = '';

    let isReadingNumber = false;
    let number = 0;

    let isReadVar = false;
    let varIndex = null;

    let isReadingChar = false;

    const executeComment = (char) => {

        if (char === '}') {

            commentBracketsDifference --;

            if (commentBracketsDifference === 0) {

                processComment (comment);
                comment = '';
                isReadingComment = false;
                index ++;
                return;
            }

            if (commentBracketsDifference < 0) {
             
                return 'Error: Wrong {} comment expression. At: ' +
                    index  + '.';
            }
        }

        if (char === '{') {
        
            commentBracketsDifference ++;
        }

        comment += char;
        index ++;
    };

    const executeFunction = (char) => {
    
        if (char === ']') {

            functionBracketsDifference --;

            if (functionBracketsDifference === 0) {

                isReadingFunction = false;
                push (new StackElement (func));
                func = '';
                functionBracketsDifference = 0;
                index ++;
                return;
            }

            if (functionBracketsDifference < 0) {
             
                return 'Error: Wrong [] brackets expression. At: ' +
                    index  + '.';
            }

        }

        if (char === '[') {

            functionBracketsDifference ++;
        }

        func += char;
        index ++;
    };

    while (index < code.length) {

        const char = code [index];

        if (isReadingComment) {

            executeComment (char);
            continue;
        }

        if (isReadingFunction) {

            executeFunction (char);
            continue;
        }

        if (char === '"') {

            if (isReadingString) {

                isReadingString = false;
                printAsString (str);
                str = '';
            } else {

                isReadingString = true;
                str = '';
            }

            index ++;
            continue;
        }

        if (isReadingString) {

            str += char;
            index ++;
            continue;
        }

        if (isReadingChar) {

            push (new StackElement (charCode (char)));
            isReadingChar = false;
            index ++;
            continue;
        }

        if (isVar (char)) {

            if (isReadVar) {
             
                return 'Variable can only have a one-symbol name from ' +
                    `'a' to 'z'. At: ${index}."`;
            }

            varIndex = charCode (char) - charCode ('a');
            isReadVar = true;

            index ++;
            continue;
        }

        if (isNumber (char)) {

            isReadingNumber = true;
            number = number * 10 +  charCode (char) - charCode ('0');
        } else if (isReadingNumber) {

            isReadingNumber = false;
            push (new StackElement (number));
            number = 0;
        }

        let a;
        let b;
        let p;
        let executionResult;
        let executionResult2;

        switch (char) {

            case '+':
                a = get (true);
                b = get (true);

                if (b === null)
                    return `Error: Not enough parameters. Function: '+'. At: ${index}.`;

                if (a.isNumber && b.isNumber) {

                    push (new StackElement (b.value + a.value));
                } else {

                    return `Error: One of parameters is not a number. Function: '+'. At: ${index}.`;
                }
                break;
            case '-':
                a = get (true);
                b = get (true);

                if (b === null)
                    return `Error: Not enough parameters. Function: '-'. At: ${index}.`;

                if (a.isNumber && b.isNumber) {

                    push (new StackElement (b.value - a.value));
                } else {

                    return `Error: One of parameters is not a number. Function: '-'. At: ${index}.`;
                }
                break;
            case '*':
                a = get (true);
                b = get (true);

                if (b === null)
                    return `Error: Not enough parameters. Function: '*'. At: ${index}.`;

                if (a.isNumber && b.isNumber) {

                    push (new StackElement (b.value * a.value));
                } else {

                    return `Error: One of parameters is not a number. Function: '*'. At: ${index}.`;
                }
                break;
            case '/':
                a = get (true);
                b = get (true);

                if (b === null)
                    return `Error: Not enough parameters. Function: '/'. At: ${index}.`;

                if (a.isNumber && b.isNumber) {

                    push (new StackElement (b.value / a.value));
                } else {

                    return `Error: One of parameters is not a number. Function: '/'. At: ${index}.`;
                }
                break;
            case '_':
                a = get (true);

                if (a === null)
                    return `Error: Not enough parameters. Function: '_'. At: ${index}.`;

                if (a.isNumber) {

                    push (new StackElement (-a.value));
                } else {

                    return `Error: Parameter is not a number. Function: '_'. At: ${index}.`;
                }
                break;
            case '=':
                a = get (true);
                b = get (true);

                if (b === null)
                    return `Error: Not enough parameters. Function: '='. At: ${index}.`;

                if (a.isNumber && b.isNumber) {

                    push (new StackElement (b.value === a.value));
                } else {

                    return `Error: One of parameters is not a number. Function: '='. At: ${index}.`;
                }
                break;
            case '>':
                a = get (true);
                b = get (true);

                if (b === null)
                    return `Error: Not enough parameters. Function: '>'. At: ${index}.`;

                if (a.isNumber && b.isNumber) {

                    push (new StackElement (b.value > a.value));
                } else {

                    return `Error: One of parameters is not a number. Function: '>'. At: ${index}.`;
                }
                break;
            case '~':
                a = get (true);

                if (a === null)
                    return `Error: Not enough parameters. Function: '~'. At: ${index}.`;

                if (a.isBoolean) {

                    push (new StackElement (!a.isTrue ()));
                } else {

                    return `Error: Parameter is not a number. Function: '~'. At: ${index}.`;
                }
                break;
            case '&':
                a = get (true);
                b = get (true);

                if (b === null)
                    return `Error: Not enough parameters. Function: '&'. At: ${index}.`;

                if (a.isBoolean && b.isBoolean) {

                    push (new StackElement (b.isTrue () && a.isTrue ()));
                } else {

                    return `Error: One of parameters is not a boolean. Function: '&' (0 - true, -1 - false). At: ${index}.`;
                }
                break;
            case '|':
                a = get (true);
                b = get (true);

                if (b === null)
                    return `Error: Not enough parameters. Function: '|'. At: ${index}.`;

                if (a.isBoolean && b.isBoolean) {

                    push (new StackElement (b.isTrue () || a.isTrue ()));
                } else {

                    return `Error: One of parameters is not a boolean. Function: '|' (0 - true, -1 - false). At: ${index}.`;
                }
                break;
            case '[':
                isReadingFunction = true;
                functionBracketsDifference = 1;
                break;
            case ']':
                return `Error: Wrong [] brackets expression. At: ${index}.`;
            case '$':
                a = get (false);
                push (a);
                break;
            case '%':
                get (true);
                break;
            case '\\':
                a = get (true);
                b = get (true);

                if (b === null) {
                
                    return `Error: Not enough parameters. Function: "\\". At: ${index}.`;
                }

                push (a);
                push (b);
                break;
            case '@':
                a = get (true);
                b = get (true);
                p = get (true);

                if (p === null) {
                
                    return `Error: Not enough parameters. Function: "@". At: ${index}.`;
                }

                push (b);
                push (a);
                push (p);
                break;
            case 'ø':case 'O':

                a = get (true);

                if (a === null) {
                
                    return `Error: Not enough parameters. Function: "ø\\O". At: ${index}.`;
                }

                if (stack.length < a.value) {

                    return `Error: No such index '${a.value}' in stack. Function: "ø\\O". At: ${index}.`;
                }

                break;
            case '!':
                a = get (true);

                if (a === null || !a.isFunction) {
                 
                    return `Error: Parameter is not a function. Function: "!". At: ${index}.`;
                }

                executionResult = execute (a.value);

                if (executionResult !== '') {
                 
                    return executionResult + `\n\tCaused by "[${a.value}]" At: ${index}.`;
                }
                break;
            case '?':
                a = get (true);
                b = get (true);

                if (b === null || !a.isFunction || !b.isBoolean) {
                
                    return `Error: Parameter is not a function. Function: "!". At: ${index}.`;
                }

                if (b.isTrue ()) {
                 
                    executionResult = execute (a.value);

                    if (executionResult !== '') {
                    
                        return executionResult + `\n\tCaused by "[${a.value}]" At: ${index}.`;
                    }
                }
                break;
            case '#':
                a = get (true);
                b = get (true);

                if (b === null || !a.isFunction || !b.isFunction) {
                
                    return `Error: Parameters are not a functions. Function: "#". At: ${index}.`;
                }

                do {
                
                    executionResult2 = execute (b.value);

                    if (executionResult2 !== '') {
                    
                        return executionResult2 + `\n\tCaused by "[${b.value}]" At: ${index}.`;
                    }

                    p = get (true);

                    if (!p.isBoolean) {

                        return `Error: Parameters is not a boolean. Function: '#' (0 - true, -1 - false). At: ${index}.`;
                    }

                    if (p.isTrue ()) {

                        executionResult = execute (a.value);

                        if (executionResult !== '') {
                        
                            return executionResult + `\n\tCaused by "[${a.value}]" At: ${index}.`;
                        }
                    }

                } while (p.isTrue ());
                break;
            case '.':
                a = get (true);

                if (a === null)
                    return `Error: Not enough parameters. Function: '.'. At: ${index}.`;

                if (a.isNumber) {

                    printAsString (a.value);
                } else {

                    return `Error: Parameter is not a number. Function: '.'. At: ${index}.`;
                }
                break;
            case ',':
                a = get (true);

                if (a === null)
                    return `Error: Not enough parameters. Function: '.'. At: ${index}.`;

                if (a.isNumber) {

                    printChar (a);
                } else {

                    return `Error: Parameter is not a number. Function: '.'. At: ${index}.`;
                }
                break;
            case '^':

                push (new StackElement (charCode (readChar ())));
                break;
            case ':':

                a = get (true);

                if (!isReadVar) {

                    return `Error: No variables have found (use it like '1f:' - Push 1; f := 1;). At: ${index}.`;
                }

                if (a === null) {

                    return `Error: Not enough parameters. At: ${index}.`;
                }
                
                vars[varIndex] = a;
                break;
            case ';':

                if (!isReadVar) {
                 
                    return `Error: No variable (use it like 'f;' - Push f;). At: ${index}.`;
                }

                push (vars[varIndex]);

                break;
            case '\'':
                isReadingChar = true;
                break;
            case 'ß':case 'B':
                console.log ('\x1Bc');
                break;
            case '{':
                isReadingComment = true;
                comment = '';
                commentBracketsDifference = 1;

                break;
            case '}':
                return `Error: Wrong {} brackets expression. At: ${index}.`;
        }

        index ++;
        isReadVar = false;
    }

    if (isReadingFunction)
        return 'Error: Wrong []brackets expression. At: the end.';

    if (isReadingNumber) {

        push (new StackElement (number));
    }

    if (isReadingString) {

        return 'Error: Missing " in string expression. At: the end.';
    }

    return '';
};

runFile = (fileName) => execute (readFile (fileName));

const init = () => {

    inputData = '';
    stack = [];
    vars = [];

    for (let i = 0; i < 26; i ++) {

        vars.push (new StackElement (0));
    }
};

const run = (fileName) => {

    init ();

    const result = runFile (fileName);
    
    if (result === '') {

        return stack;
    }

    return result + '\n' + stackToString ();
};

const runCode = (code) => {

    init ();

    const result = execute (code);
    
    if (result === '') {

        return stack;
    }

    return result + '\n' + stackToString ();
};

module.exports = {

    run,
    runCode,
};
