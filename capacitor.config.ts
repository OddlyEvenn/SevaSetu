import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sevasetu.app',
  appName: 'sevasetu',
  webDir: 'public',
  server: {
    url: 'https://seva-setu-azure.vercel.app/',
    cleartext: false
  }
};

export default config;
