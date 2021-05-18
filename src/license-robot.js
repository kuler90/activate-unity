const puppeteer = require('puppeteer');
const otplib = require('otplib');
const fs = require('fs');

module.exports = { getPersonalLicense };

let RETRY_COUNT = 2;

async function getPersonalLicense(licenseRequestFile, username, password, authenticatorKey, headless = true) {
    const licenseRequestData = fs.readFileSync(licenseRequestFile, 'utf8');
    console.log("License robot. Start");
    const licenseData = await retry(() => browser_getPersonalLicense(licenseRequestData, username, password, authenticatorKey, headless), RETRY_COUNT);
    console.log("License robot. Finish");
    return licenseData;
}

async function browser_getPersonalLicense(licenseRequestData, username, password, authenticatorKey, headless) {
    const browser = await puppeteer.launch({ headless: headless });
    try {
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(120 * 1000);
        await page.goto('https://license.unity3d.com/manual');
        await licensePage_login(page, username, password, authenticatorKey);
        try {
            await licensePage_attachFileData(page, licenseRequestData);
        } catch {
            // https://forum.unity.com/threads/i-cant-create-a-unity-license.1001648/
            await licensePage_attachFileData(page, convertToUtf16(licenseRequestData));
        }
        await licensePage_selectType(page);
        const licenseData = await licensePage_downloadLicense(page);
        return licenseData;
    } finally {
        await browser.close();
    }
}

/**
 * @param {import("puppeteer").Page} page
 */
async function licensePage_login(page, username, password, authenticatorKey) {
    console.log("License robot. Login...");
    await page.waitForSelector('#conversations_create_session_form_email');
    await page.type('#conversations_create_session_form_email', username);
    await page.type('#conversations_create_session_form_password', password);
    await Promise.all([
        page.click('input[name=commit]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    const verifyCodeInput = await page.$('#conversations_tfa_required_form_verify_code');
    if (verifyCodeInput) {
        console.log("License robot. Passing two-factor authentication...");
        if (!authenticatorKey) {
            throw new Error('account verification requested but authenticator key is not provided');
        }
        const otpTimeRemaining = otplib.authenticator.timeRemaining();
        if (otpTimeRemaining < 5) {
            await page.waitForTimeout((otpTimeRemaining + 2) * 1000); // wait for new code
        }
        const otpCode = otplib.authenticator.generate(authenticatorKey.replace(/ /g, ''));
        await verifyCodeInput.type(otpCode);
        await Promise.all([
            page.click('input[name="conversations_tfa_required_form[submit_verify_code]"]'),
            page.waitForNavigation({ waitUntil: 'networkidle0' })
        ]);
    }
}

/**
 * @param {import("puppeteer").Page} page
 */
async function licensePage_attachFileData(page, licenseRequestData) {
    console.log("License robot. Attach license request file...");
    await page.waitForTimeout(5000);
    await page.setRequestInterception(true);
    page.once("request", interceptedRequest => {
        interceptedRequest.continue({
            method: "POST",
            postData: licenseRequestData,
            headers: { "Content-Type": "text/xml" }
        });
    });
    const response = await page.goto('https://license.unity3d.com/genesis/activation/create-transaction');
    if (!response.ok()) {
        console.log(await response.text());
        throw new Error(response.statusText());
    }
}

/**
 * @param {import("puppeteer").Page} page
 */
async function licensePage_selectType(page) {
    console.log("License robot. Select license type...");
    await page.waitForTimeout(5000);
    page.once("request", interceptedRequest => {
        interceptedRequest.continue({
            method: "PUT",
            postData: JSON.stringify({ transaction: { serial: { type: "personal" } } }),
            headers: { "Content-Type": "application/json" }
        });
    });
    const response = await page.goto('https://license.unity3d.com/genesis/activation/update-transaction');
    if (!response.ok()) {
        console.log(await response.text());
        throw new Error(response.statusText());
    }
}

/**
 * @param {import("puppeteer").Page} page
 */
async function licensePage_downloadLicense(page) {
    console.log("License robot. Download license file...");
    await page.waitForTimeout(5000);
    page.once("request", interceptedRequest => {
        interceptedRequest.continue({
            method: "POST",
            postData: JSON.stringify({}),
            headers: { "Content-Type": "application/json" }
        });
    });
    const response = await page.goto('https://license.unity3d.com/genesis/activation/download-license');
    if (response.ok()) {
        const json = await response.json();
        return json['xml'];
    } else {
        console.log(await response.text());
        throw new Error(response.statusText());
    }
}

async function retry(func, retryCount) {
    while (true) {
        try {
            return await func();
        } catch (error) {
            if (retryCount > 0) {
                retryCount--;
                console.error(error);
            }
            else throw error;
        }
    }
}

function convertToUtf16(str) {
    var buf = new ArrayBuffer(str.length * 2);
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}