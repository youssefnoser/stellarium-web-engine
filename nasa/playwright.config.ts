import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 60000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:5175', channel: 'msedge', headless: true, viewport: { width: 1366, height: 900 }, ignoreHTTPSErrors: true, launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'node node_modules/next/dist/bin/next start -p 5175', url: 'http://127.0.0.1:5175', reuseExistingServer: false, timeout: 30000 },
});
