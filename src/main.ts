import 'zone.js/dist/zone';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { VScrollExampleComponent } from './v-scroll-example/v-scroll-example.component';

@Component({
  selector: 'my-app',
  standalone: true,
  imports: [CommonModule, VScrollExampleComponent],
  template: `
  <v-scroll-example></v-scroll-example>
  `,
})
export class App {
  name = 'Angular';
}

bootstrapApplication(App);
