exports.translate = (messsageList, id, language) => {
    return (messsageList.find(x => x.id == id)[language] ||
        messsageList.find(x => x.id == id)["en"])
};