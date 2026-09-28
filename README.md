# MathCopy

A Manifest V3 browser extension MVP that detects common webpage math markup and copies a readable text representation.

## Install in Chrome
1. Unzip the archive.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `mathcopy` folder.

## Install in Firefox
1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on…**.
3. Select `manifest.json` from the extracted folder.

Firefox temporary add-ons are removed when Firefox restarts. For permanent installation, the extension must be packaged and signed through Mozilla.

## Use
- Select or place the text selection over a formula and press Cmd+C (macOS) or Ctrl+C.
- Or right-click selected formula text and choose **Copy formula as readable text**.

## MVP limitations
- MathJax and KaTeX formulas are handled when their DOM exposes TeX annotations.
- Native MathML has a basic readable-text conversion.
- Some pages render formulas as canvas, SVG paths, images, or shadow DOM without accessible source. The extension cannot reliably reconstruct the original LaTeX in those cases.
- The conversion is a lightweight readable-text formatter, not a full LaTeX parser. Complex nested LaTeX may need refinement.
- Browser clipboard permissions and site restrictions can affect context-menu copying.

## Project files
- `manifest.json`: extension configuration
- `background.js`: context menu
- `content.js`: math detection, conversion, clipboard interception
