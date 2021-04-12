import { html, render } from 'https://unpkg.com/lit-html?module';
const myTemplate = (name) => html`<p>Hello ${name}</p>`;

// Render the template to the document
render(myTemplate('World'), document.body);
