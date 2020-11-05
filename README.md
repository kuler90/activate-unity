# activate-unity

GitHub Action to activate Unity license. License will be automatically returned when the job finishes.

Works on Linux, macOS and Windows.

## Inputs

### `unity-path`

Path to Unity executable. `UNITY_PATH` env will be used if not provided.

### `unity-username`

Unity activation username.

### `unity-password`

Unity activation password.

### `unity-serial`

Unity activation serial key.

### `unity-manual-license`

Unity license content for manual activation.

## Example usage

```yaml
- name: Checkout project
  uses: actions/checkout@v2

- name: Setup Unity
  uses: kuler90/setup-unity@v1

- name: Activate Unity
  uses: kuler90/activate-unity@v1
  with:
    unity-username: ${{ secrets.UNITY_USERNAME }}
    unity-password: ${{ secrets.UNITY_PASSWORD }}
    unity-serial: ${{ secrets.UNITY_SERIAL }}
```