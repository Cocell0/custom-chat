// component.js
class ModalElement extends HTMLDialogElement {
  static name = 'c-modal';

  constructor() {
    super();

    const trap = focusTrap.createFocusTrap(this, {
      clickOutsideDeactivates: false,
      escapeDeactivates: false,
    });
    this.trap = trap;
    this.addEventListener('close', () => {
      this.trap.pause();
      if (!this.classList.contains(close)) {
        this.classList.add('close');
      }
    });
  }

  openModal() {
    this.showModal();
    if (this.trap.paused) {
      this.trap.unpause()
    } else {
      this.trap.activate();
    }
    if (this.classList.contains(close)) {
      this.classList.remove('close');
    }
  }

  closeModal() {
    this.close();
    this.trap.pause();
    if (!this.classList.contains(close)) {
      this.classList.add('close');
    }
  }
}
class RippleElement extends HTMLElement {
  static name = 'c-ripple';

  static style = new CSSStyleSheet();

  constructor() {
    super()
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [CRipple.style];
  }

  ripple(event) {
    this.rippleAnimation?.cancel();

    const rect = this.surface.getBoundingClientRect();
    const rippleSize = Math.max(rect.width, rect.height) * 1.2;

    const startX = event.clientX - rect.left - rippleSize / 2;
    const startY = event.clientY - rect.top - rippleSize / 2;
    const centerX = rect.width / 2 - rippleSize / 2;
    const centerY = rect.height / 2 - rippleSize / 2;

    this.rippleAnimation = this.surface.animate({
      height: [`${rippleSize}px`, `${rippleSize}px`],
      width: [`${rippleSize}px`, `${rippleSize}px`],
      top: [`${startY}px`, `${centerY}px`],
      left: [`${startX}px`, `${centerX}px`],
      transform: [`scale(0.2)`, `scale(2)`]
    }, {
      pseudoElement: '::after',
      duration: 160,
      easing: 'cubic-bezier(0.54, 0.13, 0.95, 0.54)',
      fill: 'forwards'
    });
  }

  connectedCallback() {
    const surface = document.createElement('div');
    surface.classList.add('surface');
    this.shadowRoot.appendChild(surface);

    this.surface = surface;

    let element = surface;

    if (this.hasAttribute('for')) {
      const id = this.getAttribute('for');
      element = document.getElementById(id) || this.parentElement.getElementById(id) || this.shadowRoot.getElementById(id);
    }

    element.addEventListener('pointerdown', (event) => {

      this.ripple(event);
      surface.classList.add('pressed');

      window.addEventListener('pointerup', () => surface.classList.remove('pressed'), { once: true });
      surface.addEventListener('pointerleave', () => surface.classList.remove('pressed'), { once: true });
    });
  }

  static {
    this.style.replaceSync(`
  :host {
    display: flex;
    margin: auto;
  }
    
  :host, .surface {
    border-radius: inherit;
    position: absolute;
    inset: 0px;
    overflow: hidden;
  }

  .surface::after {
    content: "";
    opacity: 0;
    position: absolute;
  }

  .surface::before {
    background-color: var(--ripple-hover, #1d1b20);
    transition: opacity 15ms linear, background-color 15ms linear;
  }

  .surface::after {
    background: radial-gradient(closest-side, var(--ripple, black), max(100% - 70px, 65%), transparent 100%);
    transform-origin: center center;
    transition: opacity 475ms ease-in-out, top 375ms linear, left 375ms linear, transform 1s linear;
    display: flex;
    position: absolute;
  }

  .pressed::after {
    opacity: .16;
    transition-duration: 105ms;
  }
  `);
    customElements.define(this.name, this);
  }
}
class OverlayElement extends ModalElement {
  static elementName = 'c-overlay';
  constructor() {
    super();
  }


  static get observedAttributes() {
    return ['for'];
  }

  connectedCallback() {
    const handler = document.getElementById(this.getAttribute('for'));

    handler.addEventListener('click', () => {
      this.openModal();
    }, { passive: true });

    this.querySelector('button.close-button').addEventListener('click', () => {
      this.closeModal();
    })
  }
}
class AccordianElement extends HTMLElement {
  static name = 'c-accordian';

  constructor() {
    super();
  }

  connectedCallback() {
    const head = document.createElement('c-button');
    const content = document.createElement('div');

    head.classList.add('head')
    head.innerText = this.getAttribute('label');
    head.setAttribute('icon', 'expand_circle_down');
    head.setAttribute('trailing-icon', '');

    if (!this.getAttribute('aria-expanded')) {
      this.setAttribute('aria-expanded', 'false');
    }

    content.classList.add('content')
    content.innerHTML = this.innerHTML;
    this.innerHTML = '';

    this.appendChild(head);
    this.appendChild(content);
  }

  static {
    customElements.define(this.name, this);
  }
}
class TabsElement extends HTMLInputElement {
  static elementName = 'c-tab';

  constructor() {
    super();
    this.type = 'radio';

    if (!window[`${this.name}NodeList`]) {
      window[`${this.name}NodeList`] = [];
    }
    window[`${this.name}NodeList`].push(this);

    console.log(`${this.name}NodeList`);
    console.log(window[`${this.name}NodeList`]);

    if (!this.checked) {
      if (document.getElementById(this.value)) {
        document.getElementById(this.value).hidden = true;
      }
    }

    let allTab;

    this.addEventListener('change', () => {
      setInterval(() => {
        allTab = document.querySelectorAll(`input[is="c-tab"][name="${this.name}"]`);
      }, 600);

      allTab.forEach((eachTab) => {
        const tabFrame = document.getElementById(eachTab.value);

        if (tabFrame) {
          tabFrame.hidden = true;
        }
      })

      const tabFrame = document.getElementById(this.value);

      if (this.checked) {
        if (tabFrame) {
          tabFrame.hidden = false;
        }
      } else if (tabFrame && !tabFrame.hidden) {
        tabFrame.hidden = true;
      }
    })
  }
}
class MatIcon extends HTMLElement {
  static name = 'mat-icon';

  constructor() {
    super();
  }

  connectedCallback() {
    this.hasAttribute('translate') || (this.translate = false);
    this.hasAttribute('role') || (this.role = 'img');
    this.hasAttribute('aria-hidden') || (this.ariaHidden = true);
  }
}

customElements.define(MatIcon.name, MatIcon);
customElements.define(TabsElement.elementName, TabsElement, { extends: 'input' });
customElements.define(ModalElement.name, ModalElement, { extends: 'dialog' });
customElements.define(OverlayElement.elementName, OverlayElement, { extends: 'dialog' });