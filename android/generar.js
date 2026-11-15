#!/usr/bin/env node
// Copyright 2026 Oksigenia SL
// SPDX-License-Identifier: Apache-2.0
//
// Regenerates the Android project of Jepyso (a Trusted Web Activity that opens https://app.jepyso.com) from
// twa-manifest.json, with the project generator of Bubblewrap (@bubblewrap/core, pinned to 1.27.0), and then applies
// the few changes this project needs on top of Bubblewrap's template:
//
//   - Maven Central instead of the retired JCenter;
//   - Android Gradle Plugin 8.13.1 and Gradle 8.14 (checksum pinned), which run on JDK 21: Bubblewrap's own build
//     insists on JDK 17;
//   - the release signing key read from the environment (see construir.sh), never from a file in the repository;
//   - the splash background in the dark colour when the phone is in dark mode;
//   - the App Links host written out in the manifest;
//   - no package attribute in the manifest and Java 17, to build without warnings;
//   - the icon pictures drawn again from the vectors, and the full-square icon for the Google Play listing.
//
// Only needed when twa-manifest.json, the icons or the Bubblewrap version change. The normal rebuild is construir.sh.
//
// Usage: BUBBLEWRAP_TOOLING=<folder where @bubblewrap/core@1.27.0 is installed> node generar.js

'use strict';

const fs = require('fs');
const path = require('path');

const BUBBLEWRAP_VERSION = '1.27.0';
const AGP_VERSION = '8.13.1';
const GRADLE_DISTRIBUTION = 'https\\://services.gradle.org/distributions/gradle-8.14-all.zip';
const GRADLE_SHA256 = 'efe9a3d147d948d7528a9887fa35abcf24ca1a43ad06439996490f77569b02d1';

const here = __dirname;
const tooling = process.env.BUBBLEWRAP_TOOLING || here;
const corePath = require.resolve('@bubblewrap/core', { paths: [tooling] });
const corePackage = require(path.join(path.dirname(corePath), '..', 'package.json'));
if (corePackage.version !== BUBBLEWRAP_VERSION) {
  console.error(`@bubblewrap/core ${corePackage.version} found; this script is written for ${BUBBLEWRAP_VERSION}.`);
  process.exit(1);
}
const { TwaGenerator, TwaManifest, ConsoleLog } = require(corePath);
const { Resvg } = require(require.resolve('@resvg/resvg-js', { paths: [path.dirname(corePath)] }));

// Bubblewrap draws the launcher icon and the splash from the 512 px PNG of the web, so the splash (up to 1200 px)
// would come out blurred. They are drawn again from the vectors, following the icon's own rule: the corner marks
// from 96 px up (icono.svg, here), none below (the web's icono.svg).
const ICON_WITH_MARKS = path.join(here, 'icono.svg');
const ICON_WITHOUT_MARKS = path.join(here, '..', 'app', 'iconos', 'icono.svg');
const MASKABLE = path.join(here, '..', 'app', 'iconos', 'maskable-512.png');
const VECTOR_PICTURES = {
  'app/src/main/res/mipmap-mdpi/ic_launcher.png': 48,
  'app/src/main/res/mipmap-hdpi/ic_launcher.png': 72,
  'app/src/main/res/mipmap-xhdpi/ic_launcher.png': 96,
  'app/src/main/res/mipmap-xxhdpi/ic_launcher.png': 144,
  'app/src/main/res/mipmap-xxxhdpi/ic_launcher.png': 192,
  'app/src/main/res/drawable-mdpi/splash.png': 300,
  'app/src/main/res/drawable-hdpi/splash.png': 450,
  'app/src/main/res/drawable-xhdpi/splash.png': 600,
  'app/src/main/res/drawable-xxhdpi/splash.png': 900,
  'app/src/main/res/drawable-xxxhdpi/splash.png': 1200,
};

// Replaces exactly one occurrence of `from` in a file; stops if the template changed under our feet.
function patch(file, from, to) {
  const full = path.join(here, file);
  const text = fs.readFileSync(full, 'utf8');
  const count = text.split(from).length - 1;
  if (count !== 1) {
    throw new Error(`${file}: expected one occurrence of ${JSON.stringify(from)}, found ${count}`);
  }
  fs.writeFileSync(full, text.replace(from, to));
}

async function main() {
  const manifest = await TwaManifest.fromFile(path.join(here, 'twa-manifest.json'));
  const problem = manifest.validate();
  if (problem) throw new Error(`twa-manifest.json: ${problem}`);

  await new TwaGenerator().createTwaProject(here, manifest, new ConsoleLog('generar'));

  // Repositories and build tools.
  patch('build.gradle', "        google()\n        jcenter()\n    }\n    dependencies",
      "        google()\n        mavenCentral()\n    }\n    dependencies");
  patch('build.gradle', "        google()\n        jcenter()\n    }\n}",
      "        google()\n        mavenCentral()\n    }\n}");
  patch('build.gradle', "com.android.tools.build:gradle:8.9.1", `com.android.tools.build:gradle:${AGP_VERSION}`);
  patch('build.gradle', 'delete rootProject.buildDir', 'delete rootProject.layout.buildDirectory');
  patch('gradle/wrapper/gradle-wrapper.properties',
      'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.11.1-bin.zip',
      `distributionUrl=${GRADLE_DISTRIBUTION}\ndistributionSha256Sum=${GRADLE_SHA256}`);

  // Release signing from the environment: the keystore and its password never enter the repository.
  patch('app/build.gradle', '    buildTypes {\n        release {\n            minifyEnabled true\n        }\n    }',
      [
        '    // The upload key lives outside the repository. construir.sh passes its path and password',
        '    // through the environment; without them the release build comes out unsigned.',
        '    signingConfigs {',
        '        release {',
        "            def keystore = System.getenv('JEPYSO_KEYSTORE')",
        '            if (keystore) {',
        '                storeFile file(keystore)',
        "                storePassword System.getenv('JEPYSO_KEYSTORE_PASSWORD')",
        "                keyAlias System.getenv('JEPYSO_KEY_ALIAS') ?: 'oksigenia-jepyso'",
        "                keyPassword System.getenv('JEPYSO_KEY_PASSWORD') ?: System.getenv('JEPYSO_KEYSTORE_PASSWORD')",
        '            }',
        '        }',
        '    }',
        '    buildTypes {',
        '        release {',
        '            minifyEnabled true',
        "            if (System.getenv('JEPYSO_KEYSTORE')) {",
        '                signingConfig signingConfigs.release',
        '            }',
        '        }',
        '    }',
      ].join('\n'));
  patch('app/build.gradle', '    lintOptions {', '    lint {');

  // The splash background follows the phone's dark mode, like the web app (theme-color #121517 in dark).
  const night = path.join(here, 'app/src/main/res/values-night');
  fs.mkdirSync(night, { recursive: true });
  fs.writeFileSync(path.join(night, 'colors.xml'), [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<!-- Splash background in dark mode: the dark background of the web app. -->',
    '<resources>',
    `    <color name="splashBackgroundColor">${manifest.themeColorDark.hex()}</color>`,
    '</resources>',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(here, 'app/src/main/res/values/splash.xml'), [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<!-- Splash background in light mode: the background_color of the web manifest. -->',
    '<resources>',
    `    <color name="splashBackgroundColor">${manifest.backgroundColor.hex()}</color>`,
    '</resources>',
    '',
  ].join('\n'));
  patch('app/src/main/AndroidManifest.xml',
      'android:name="android.support.customtabs.trusted.SPLASH_SCREEN_BACKGROUND_COLOR"\n' +
      '                android:resource="@color/backgroundColor"',
      'android:name="android.support.customtabs.trusted.SPLASH_SCREEN_BACKGROUND_COLOR"\n' +
      '                android:resource="@color/splashBackgroundColor"');

  // The namespace comes from build.gradle; AGP ignores the old package attribute and warns about it.
  patch('app/src/main/AndroidManifest.xml', `\n    package="${manifest.packageId}">`, '>');
  // Java 17 for the four classes of the launcher: Java 8 is obsolete for the JDK 21 that builds it.
  patch('app/build.gradle', '        sourceCompatibility JavaVersion.VERSION_1_8\n        targetCompatibility JavaVersion.VERSION_1_8',
      '        sourceCompatibility JavaVersion.VERSION_17\n        targetCompatibility JavaVersion.VERSION_17');

  // The App Links host written out, not through @string/hostName: what Android verifies against
  // https://app.jepyso.com/.well-known/assetlinks.json is then plain to read in the manifest and in any checker.
  patch('app/src/main/AndroidManifest.xml',
      '<data android:scheme="https"\n                    android:host="@string/hostName"',
      `<data android:scheme="https"\n                    android:host="${manifest.host}"`);

  const withMarks = fs.readFileSync(ICON_WITH_MARKS, 'utf8');
  const withoutMarks = fs.readFileSync(ICON_WITHOUT_MARKS, 'utf8');
  for (const [file, size] of Object.entries(VECTOR_PICTURES)) {
    const svg = size >= 96 ? withMarks : withoutMarks;
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
    fs.writeFileSync(path.join(here, file), png);
  }
  // Google Play wants a full square and puts its own rounded corners on it: the maskable icon, not the tile.
  fs.copyFileSync(MASKABLE, path.join(here, 'store_icon.png'));

  console.log('Project regenerated. Build it with construir.sh.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
