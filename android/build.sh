#!/bin/bash
# Builds the debug-signed APK with the Android SDK command-line tools (no Gradle).
set -euo pipefail
cd "$(dirname "$0")"
SDK=${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}
BT=$SDK/build-tools/35.0.0
JAR=$SDK/platforms/android-35/android.jar
rm -rf build && mkdir -p build/res build/gen build/classes build/dex
"$BT/aapt2" compile --dir res -o build/res.zip
"$BT/aapt2" link -o build/unsigned.apk -I "$JAR" --manifest AndroidManifest.xml -A assets --java build/gen build/res.zip --auto-add-overlay
javac -source 17 -target 17 -nowarn -Xlint:-options -cp "$JAR" -d build/classes $(find src build/gen -name '*.java')
"$BT/d8" --release --min-api 29 --lib "$JAR" --output build/dex $(find build/classes -name '*.class')
(cd build/dex && zip -q -j ../unsigned.apk classes.dex)
"$BT/zipalign" -f -p 4 build/unsigned.apk build/aligned.apk
KS=debug.keystore
[ -f $KS ] || keytool -genkeypair -keystore $KS -storepass android -keypass android -alias debug -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Omaha Lab Debug" >/dev/null 2>&1
"$BT/apksigner" sign --ks $KS --ks-pass pass:android --key-pass pass:android --out ../omaha-lab.apk build/aligned.apk
"$BT/apksigner" verify ../omaha-lab.apk && echo "Built ../omaha-lab.apk"
