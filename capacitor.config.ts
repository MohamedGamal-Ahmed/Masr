import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mo_gamal.masar',
  appName: 'Masar',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020617',
      overlaysWebView: true
    }
  },
  android: {
    // Enable immersive fullscreen mode
    backgroundColor: '#020617'
  }
};

export default config;
