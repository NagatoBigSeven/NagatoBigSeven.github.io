# Destroy this webpage

Adapted from **Destroy Any Website (clone)** by [ychisbest](https://github.com/ychisbest/destroy-any-website), commit `1c0efd5d1eab8f109bd879053e6f19ca7c876374`.

The upstream README identifies this as a remake of **Destroy Any Website**, the game by Hugo Duprez / Sprite Fusion. This adaptation uses the open-source remake, not Sprite Fusion's original implementation.

Upstream declares `"license": "MIT"` in `package.json`. An unchanged copy is included as `upstream-package.json`. Upstream does not provide a separate license file or copyright line; no copyright ownership is asserted here on its behalf. The standard MIT permission text is reproduced below.

Changes for this website:

- Keep the upstream character, movement, seven weapons, grenades, physics, destruction, procedural backgrounds, pixel art, and synthesized sound.
- Load a script-free snapshot supplied by the parent page into a same-origin sandboxed iframe, replacing the arbitrary-site proxy.
- Remove multiplayer networking and the arbitrary-URL menu; start a local single-player game automatically.
- Add English/Chinese controls, compact local styling, and pause, rebuild, and return-to-page actions.
- Resume suspended Web Audio on interaction. No external game service or font is loaded.
- Let Tab and Space operate the pause menu, and restore keyboard focus when resuming.

## MIT license permission text

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
