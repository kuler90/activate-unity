const unity = require('./unity');
const licenseRobot = require('./license-robot');

let UNITY_PATH = "/Applications/Unity/Hub/Editor/2020.3.4f1/Unity.app/Contents/MacOS/Unity";
let UNITY_USERNAME = "";
let UNITY_PASSWORD = "";
let UNITY_AUTHENTICATOR_KEY = "";
let BROWSER_HEADLESS = false;

async function run() {
    const licenseRequestFile = await unity.createManualActivationFile(UNITY_PATH);
    const licenseData = await licenseRobot.getPersonalLicense(licenseRequestFile, UNITY_USERNAME, UNITY_PASSWORD, UNITY_AUTHENTICATOR_KEY, BROWSER_HEADLESS);
    await unity.activateManualLicense(UNITY_PATH, licenseData);
}

run();