const core = require('@actions/core');
const unity = require('./unity');

async function run() {
    try {
        const unityPath = core.getInput('unity-path') || process.env.UNITY_PATH;
        if (!unityPath) {
            throw new Error('unity path not found');
        }
        unity.returnLicense(unityPath);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();