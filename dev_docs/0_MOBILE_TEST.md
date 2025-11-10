-- Android

adb devices -l

adb pair 192.168.1.83:46651

adb connect 192.168.1.83:44113

adb reverse tcp:8000 tcp:8000


npx cap sync android && cd android && ./gradlew assembleDebug && cd .. && adb -s 192.168.1.83:44113 install -r android/app/build/outputs/apk/debug/app-debug.apk && adb -s 192.168.1.83:44113 shell am start -n io.apuntador.app/.MainActivity



-- IOS

npm run build && npx cap sync ios
npx cap open ios


