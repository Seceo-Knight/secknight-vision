// Validate IP Address
const ValidateIPAddress = (ipAddress) => {
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipAddress)) {
        return (true);
    }
    return (false);
}

// http based ip address masking
function ip1(x) {
    if (ValidateIPAddress(x?.url?.split("//")[1]?.split('/')[0]) || ValidateIPAddress(x?.url?.split(":")[1]?.split("//")[1])) {
        let temp = x?.url?.split("//")[0];
        x.url = x?.url?.split("//")[1];
        x.url = x?.url?.split("/");
        x.url[0] = x?.url[0]?.replace(/[0-9]/g, "x");
        x.url = x?.url?.join("/");
        x.url = temp + "//" + x?.url;
        return x;
    }
    return x;
}

// without http based ip address masking 
function ip2(x) {
    if (ValidateIPAddress(x?.url?.split(":")[0]) || ValidateIPAddress(x?.url?.split("/")[0]) || x?.url?.split(" ")[1]) {
        x.url = x?.url?.split("/");
        x.url[0] = x?.url[0]?.replace(/[0-9]/g, "x");
        x.url = x?.url?.join("/");
        return x;
    }
    return x;
}

// Passing URL to maskingIP function
function maskingIP(url = "") {
    let maskedData = "";
    let x = {
        url: url
    }
    try {
        if (x.url.includes("http")) {
            maskedData = ip1(x);
        } else {
            maskedData = ip2(x);
        }
        return maskedData.url;
    } catch (error) {
        console.log("Ip Masking Error",url);
        return url;
    }
}


module.exports = maskingIP;