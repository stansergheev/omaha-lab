# Омаха-лаборатория (Omaha Lab)

A Pot-Limit Omaha analyzer in Russian. Photograph your four hole cards and the flop, and it tells you whether to raise, call or fold, backed by Monte Carlo simulation.

*Анализатор пот-лимит Омахи: сфотографируйте свои четыре карты и флоп — и получите совет «рейз, колл или фолд» на основе тысяч смоделированных раздач.*

## What it does

- **Photo reading.** Claude reads your cards (and, from an online-table screenshot, the pot and the bet to call) and fills them in. You can fix any card by tapping it.
- **Verdict.** Raise, call, fold or check, with the reason in numbers: your equity against the opponents' range versus the equity the price requires.
- **Omaha rules.** Every hand uses exactly two hole cards and three board cards.
- **Nut check.** Whether you hold the best possible hand right now, and what the nuts is if you don't.
- **Outs, board texture, pot-limit bet sizing** and a starting-hand profile with 6-max opening ranges.

Equity comes from 30,000 simulated deals per spot. Starting hands are ranked with a simple heuristic score, so treat the percentages and opening ranges as approximate guides.

## Android app

Download `omaha-lab.apk` from the [Releases](../../releases) page and open it on an Android 10+ phone. Android will ask to allow installs from that source. The APK is signed with a debug key, so Play Protect may warn about it.

Photo reading in the app calls the Claude API with your own Anthropic API key. Paste it into the field at the top of the app once; it is stored only on the phone, and each read is billed to your API account. Everything else works offline.

## Project layout

```
web/app.html         the page (UI, analysis, verdict logic)
web/core.js          hand evaluator and Monte Carlo simulator
web/reader/          Claude API card reader for the Android build (official TypeScript SDK, bundled with esbuild)
tools/assemble.py    builds dist/omaha-lab.html and android/assets/index.html
android/             WebView wrapper: manifest, MainActivity, icon, build.sh
```

## Building

Needs Node.js, Python 3, a JDK, and the Android SDK command-line tools with `platforms;android-35` and `build-tools;35.0.0`.

```bash
brew install --cask android-commandlinetools
sdkmanager --sdk_root=/opt/homebrew/share/android-commandlinetools "platforms;android-35" "build-tools;35.0.0"
./build.sh
```

This writes `omaha-lab.apk` to the project root. Set `ANDROID_HOME` if your SDK lives elsewhere. The build creates a local debug keystore on first run; it is not committed.

`dist/omaha-lab.html` is the same page for use inside Claude, where photos are read through the Claude viewer instead of an API key.

## Disclaimer

For studying hands, not for use at a live table. Photo reading can misread cards: check them before relying on the advice.
