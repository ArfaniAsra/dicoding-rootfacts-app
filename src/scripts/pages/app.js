import HomePage from "./home/home-page.js";

class App {
  #container = null;

  constructor({ container }) {
    this.#container = container;
  }

  async renderPage() {
    const page = new HomePage();
    this.#container.innerHTML = await page.render();
    await page.afterRender();
  }
}

export default App;
