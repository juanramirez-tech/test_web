import { blockClickjacking } from './app/core/security/clickjacking';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

blockClickjacking();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
