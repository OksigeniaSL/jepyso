#!/usr/bin/env bash
# Copyright 2026 Oksigenia SL
# SPDX-License-Identifier: Apache-2.0
#
# Builds the Android app of Jepyso: the signed bundle (AAB) for Google Play and a signed universal APK to install on
# a phone by hand. Everything it needs from outside the repository comes through the environment:
#
#   JEPYSO_KEYSTORE            the upload keystore (.jks)
#   JEPYSO_KEYSTORE_PASS_FILE  a file holding its password (the same for the store and the key)
#   JEPYSO_SALIDA              the folder where the AAB and the APK are copied (outside git)
#   ANDROID_HOME               the Android SDK (platform 36, build-tools 35)
#   JAVA_HOME                  a JDK 17 or newer (21 is fine)
#
# Usage: ./construir.sh [extra Gradle options, e.g. --warning-mode all]

set -euo pipefail

cd "$(dirname "$0")"

for v in JEPYSO_KEYSTORE JEPYSO_KEYSTORE_PASS_FILE JEPYSO_SALIDA ANDROID_HOME JAVA_HOME; do
	if [ -z "${!v:-}" ]; then
		echo "Missing $v (see the header of this script)." >&2
		exit 1
	fi
done
[ -f "$JEPYSO_KEYSTORE" ] || { echo "No keystore at $JEPYSO_KEYSTORE" >&2; exit 1; }
[ -f "$JEPYSO_KEYSTORE_PASS_FILE" ] || { echo "No password file at $JEPYSO_KEYSTORE_PASS_FILE" >&2; exit 1; }

JEPYSO_KEYSTORE="$(realpath "$JEPYSO_KEYSTORE")"
JEPYSO_KEYSTORE_PASSWORD="$(tr -d '\r\n' < "$JEPYSO_KEYSTORE_PASS_FILE")"
export JEPYSO_KEYSTORE JEPYSO_KEYSTORE_PASSWORD ANDROID_HOME JAVA_HOME

version_name=$(sed -n 's/^ *versionName "\(.*\)"$/\1/p' app/build.gradle)
version_code=$(sed -n 's/^ *versionCode \([0-9]*\)$/\1/p' app/build.gradle)
name="jepyso-${version_name}-${version_code}"

# No daemon left behind once the build is over.
./gradlew --no-daemon "$@" clean bundleRelease packageReleaseUniversalApk

mkdir -p "$JEPYSO_SALIDA"
cp app/build/outputs/bundle/release/app-release.aab "$JEPYSO_SALIDA/$name.aab"
cp app/build/outputs/apk_from_bundle/release/app-release-universal.apk "$JEPYSO_SALIDA/$name-universal.apk"

# Both must carry the upload key.
build_tools=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
"$build_tools/apksigner" verify --print-certs "$JEPYSO_SALIDA/$name-universal.apk" | grep -E 'Signer #1 certificate (DN|SHA-256)'
"$JAVA_HOME/bin/jarsigner" -verify "$JEPYSO_SALIDA/$name.aab" | grep -x "jar verified."

echo "AAB: $JEPYSO_SALIDA/$name.aab"
echo "APK: $JEPYSO_SALIDA/$name-universal.apk"
