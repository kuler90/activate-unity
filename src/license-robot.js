const puppeteer = require('puppeteer');
const otplib = require('otplib');
const fs = require('fs');

module.exports = { getPersonalLicense };

let RETRY_COUNT = 2;
let BROWSER_HEADLESS = true;

async function getPersonalLicense(licenseRequestFile, username, password, authenticatorKey) {
    const licenseRequestData = fs.readFileSync(licenseRequestFile, 'utf8');
    const licenseData = await retry(() => browser_getPersonalLicense(licenseRequestData, username, password, authenticatorKey), RETRY_COUNT);
    return licenseData;
}

async function browser_getPersonalLicense(licenseRequestData, username, password, authenticatorKey) {
    const browser = await puppeteer.launch({ headless: BROWSER_HEADLESS });
    try {
        const page = await browser.newPage();
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
    await page.waitForSelector('#conversations_create_session_form_email');
    await page.type('#conversations_create_session_form_email', username);
    await page.type('#conversations_create_session_form_password', password);
    await page.click('input[name=commit]');
    await page.waitForNavigation();
    await page.waitForTimeout(1000);

    const verifyCodeInput = await page.$('#conversations_tfa_required_form_verify_code');
    if (verifyCodeInput) {
        if (!authenticatorKey) {
            throw new Error('account verification requested but authenticator key is not provided');
        }
        const otpTimeRemaining = otplib.authenticator.timeRemaining();
        if (otpTimeRemaining < 5) {
            await page.waitForTimeout((otpTimeRemaining + 2) * 1000); // wait for new code
        }
        const otpCode = otplib.authenticator.generate(authenticatorKey.replace(/ /g, ''));
        await verifyCodeInput.type(otpCode);
        await page.click('input[name="conversations_tfa_required_form[submit_verify_code]"]');
        await page.waitForNavigation();
        await page.waitForTimeout(1000);
    }
}

/**
 * @param {import("puppeteer").Page} page
 */
async function licensePage_attachFileData(page, licenseRequestData) {
    await page.waitForTimeout(2000);
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
    await page.waitForTimeout(1000);
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
    await page.waitForTimeout(1000);
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
            if (retryCount > 0)
                retryCount--;
            else
                throw error;
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