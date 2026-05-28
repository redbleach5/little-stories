import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.littlestories.app',
  appName: 'Маленькие Истории',
  webDir: 'out',
  server: {
    // In development, you can point to your dev server:
    // url: 'http://192.168.1.X:3000',
    // cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#fff7ed',
      showSpinner: false,
    },
  },
};

export default config;
