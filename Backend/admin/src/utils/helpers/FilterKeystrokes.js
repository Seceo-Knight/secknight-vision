const filterKeystrokes = (text, isFilterKeyStroke) => {
    if(isFilterKeyStroke) return text.replace(/⌫/g, "").replace(/⎵/g, " ").replace(/ⓟ/g, '').replace(/ⓒ/g, '').replace(/↵/g, '').replace(/⎋/g, '').replace(/⇪/g, '').replace(/ⓧ/g, '').replace(/⇥/g, '');
    else return text;
}
module.exports = filterKeystrokes;