// Run after `cap add android`. Adds the camera permission the QR scanner needs.
import fs from 'node:fs'
const f = 'android/app/src/main/AndroidManifest.xml'
if (!fs.existsSync(f)) { console.error('Run "npm run app:android:add" first.'); process.exit(1) }
let s = fs.readFileSync(f, 'utf8')
const add = (line, key) => { if (!s.includes(key)) s = s.replace('<application', `${line}\n    <application`) }
add('<uses-permission android:name="android.permission.CAMERA" />', 'android.permission.CAMERA')
add('<uses-feature android:name="android.hardware.camera" android:required="false" />', 'android.hardware.camera')
fs.writeFileSync(f, s); console.log('AndroidManifest.xml patched (camera permission).')
