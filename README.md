# activate-unity

<p align="left">
  <a href="https://github.com/kuler90/activate-unity/actions"><img alt="GitHub Actions status" src="https://github.com/kuler90/activate-unity/workflows/test%20personal%20license/badge.svg?branch=master"></a>
</p>

GitHub Action to activate personal or professional Unity license. License will be automatically returned at the end of a job.

Works on Linux, macOS and Windows.

## Inputs

### `unity-path`

Path to Unity executable. `UNITY_PATH` env will be used if not provided.

### `unity-username`

**Required** Unity account username.

### `unity-password`

**Required** Unity account password.

### `unity-authenticator-key`

Unity account [authenticator key](#How-to-obtain-authenticator-key) for Authenticator App (Two Factor Authentication). Used for account verification during Personal license activation.

### `unity-serial`

Unity license serial key. Used for Plus/Professional license activation.

## How to obtain authenticator key

1. Login to Unity account
2. Go to account settings
3. Activate Two Factor Authentication through Authenticator App
4. On page with QR code click "Can't scan the barcode?" and save key
5. Finish activation

## Example usage

```yaml
- name: Checkout project
  uses: actions/checkout@v2

- name: Setup Unity
  uses: kuler90/setup-unity@v1
  with:
    unity-modules: android

- name: Activate Unity
  uses: kuler90/activate-unity@v1
  with:
    unity-username: ${{ secrets.UNITY_USERNAME }}
    unity-password: ${{ secrets.UNITY_PASSWORD }}
    unity-authenticator-key: ${{ secrets.UNITY_AUTHENTICATOR_KEY }}

- name: Build Unity
  uses: kuler90/build-unity@v1
  with:
    build-target: Android
    build-path: ./build.apk
```