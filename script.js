class CRipple extends HTMLElement {
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
  };
  
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
};
class COverlay extends HTMLElement {
  constructor() {
    super();
  }

  static name = 'c-overlay';

  static get observedAttributes() {
    return ['for'];
  }
  
  connectedCallback() {
    const trap = focusTrap.createFocusTrap(this);
    const wrapper = document.createElement('div');
    const surface = document.createElement('div');
    const closeButton = document.createElement('c-button');
    this.closeButton = closeButton;
    const handler = document.getElementById(this.getAttribute('for'));

    closeButton.classList.add('overlay-close-button');
    closeButton.setAttribute('icon', 'close');

    wrapper.classList.add('wrapper');
    surface.classList.add('surface');

    wrapper.appendChild(closeButton);
    wrapper.appendChild(surface);
    surface.innerHTML = this.innerHTML;
    this.innerHTML = '';

    this.appendChild(wrapper);

    handler.addEventListener('click', (event) => {
      this.toggle();
    }, { passive: true });
    closeButton.addEventListener('click', () => {
      if (this.classList.contains('fade-open')) {
        trap.pause();
        this.classList.remove('fade-open');
        this.classList.add('fade-close');
        console.log(trap);
        handler.focus();
        handler.querySelector('button').focus();
      }
    }, { passive: true });

    window.addEventListener('pointerdown', (event) => {
      if (!this.contains(event.target) && event.target !== handler && !handler.contains(event.target)) {
        if (this.classList.contains('fade-open')) {
          trap.pause();
          this.classList.remove('fade-open');
          this.classList.add('fade-close');
        }
      }
    });

  }

  toggle() {
    if (this.classList.contains('fade-open')) {
      this.classList.remove('fade-open');
      this.classList.add('fade-close');
    } else {
      this.classList.remove('fade-close');
      this.classList.add('fade-open');
      this.closeButton.querySelector('button').focus();
      this.addEventListener('animationend', () => {
        this.closeButton.querySelector('button').focus();
        if (trap.paused) {
          trap.unpause();
        } else {
          trap.activate({ allowOutsideClick: true });
        }
      }, { once: true });
    }
  }
  
  static {
    customElements.define(this.name, this);
  }
};
class CAccordian extends HTMLElement {
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
};
class CButton extends HTMLElement {
  constructor() {
    super();
  }

  static name = 'c-button';

  static get observedAttributes() {
    return ['disabled', 'icon'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.button || !this.icon) return;

    if (name === 'disabled') {
      if (newValue !== null) {
        this.button.disabled = true;
      } else {
        this.button.disabled = false;
      }
    }

    if (name === 'icon') {
      if (oldValue !== newValue) {
        this.icon.innerText = newValue;
      }
    }
  }

  connectedCallback() {
    const button = document.createElement('button');
    const icon = document.createElement('span');
    const content = document.createElement('span');

    this.button = button;
    this.icon = icon;

    icon.classList.add('icon');
    content.classList.add('content');

    const currentHTML = this.innerHTML;
    content.innerHTML = currentHTML;

    if (this.innerHTML) {
      this.innerHTML = '';
      button.appendChild(content);
      if (!this.hasAttribute('variant')) {
        this.setAttribute('variant', 'text');
      }
    } else if (this.hasAttribute('icon')) {
      this.setAttribute('variant', 'icon');
    }

    if (this.hasAttribute('icon')) {
      if (this.hasAttribute('trailing-icon')) {
        button.appendChild(icon);
      } else {
        button.prepend(icon);
      }
    }

    if (this.hasAttribute('disabled')) {
      button.disabled = true;
    }

    icon.innerText = this.getAttribute('icon');
    this.appendChild(button);

    button.addEventListener('pointerenter', () => {
      if (!button.disabled) {
        const _class = 'hovered';
        this.classList.add(_class);

        button.addEventListener('pointerleave', () => this.classList.remove(_class), { once: true });
      }
    }, { passive: true });

    button.addEventListener('pointerdown', () => {
      if (!button.disabled) {
        const _class = 'pressed';
        this.classList.add(_class);

        window.addEventListener('pointerup', () => this.classList.remove(_class), { once: true });
        button.addEventListener('pointerleave', () => this.classList.remove(_class), { once: true });
      }
    }, { passive: true });

    button.addEventListener('touchstart', () => {
      if (!button.disabled) {
        button.classList.add('touched');

        button.addEventListener('focusout', () => {
          button.classList.remove('touched');
        }, { passive: true, once: true });
      }
    }, { passive: true });

    button.addEventListener('keydown', (event) => {
      const _class = 'pressed';
      if (event.key === ' ' || event.key === 'Enter') {
        this.classList.add(_class);
      } else {
        return
      }

      window.addEventListener('keyup', () => this.classList.remove(_class), { once: true });
    }, { passive: true });

    // connected callback end
  }

  static {
    customElements.define(this.name, this);
  }
};

const app = {
  theme: {
    ["Warm Light"]: {
      "description": "A light theme with warm colors to create a visually appealing design; embrace the light.",
      "value": `
  color-scheme: light;

  /* palette */
  --primary: hsl(39, 75%, 64%);
  --primary-100: hsl(39, 50%, 90%);
  --primary-200: hsl(39, 60%, 85%);
  --primary-300: hsl(39, 60%, 70%);
  --primary-shadow: hsl(40, 32%, 38%, 32%);
  --primary-opaque: hsl(39, 70%, 74% / 0.8);

  --secondary: hsl(40, 80%, 23%);
  --secondary-100: hsl(40, 80%, 26%);
  --secondary-200: hsl(40, 60%, 32%);
  --secondary-300: hsl(40, 45%, 38%);
  --secondary-shadow: hsl(40, 45%, 38%, 32%);

  --hovered: hsl(43, 70%, 92%);
  --pressed: hsl(40, 74%, 74%);

  --tonal: hsl(33, 90%, 74%);
  --tonal-hovered: hsl(33, 90%, 70%);
  --tonal-pressed: hsl(33, 90%, 65%);
  --tonal-ripple: hsl(33, 60%, 70%);
  --tonal-shadow: hsl(33, 32%, 30%, 80%);
  --tonal-outline: hsl(33, 80%, 74%);

  --elevated: hsl(40, 80%, 88%);
  --elevated-hovered: hsl(40, 60%, 80%);
  --elevated-pressed: hsl(40, 50%, 76%);
  --elevated-shadow-front: hsl(40, 32%, 40%, 80%);
  --elevated-shadow-back: hsl(40, 32%, 40%, 30%);

  --accent: hsl(15, 31%, 52%);

  --background: hsl(40, 80%, 98%);
  --surface: hsl(43, 44%, 94%);
  --overlay-shadow: hsl(16 12% 20% / 0.6);
  --on-surface: hsl(44, 34%, 92%);

  --text: hsl(37, 8%, 20%);
  --text-primary: hsl(38, 25%, 36%);
  --text-tonal: hsl(38, 35%, 40%);
  --button-text: hsl(38, 9%, 36%);

  --filled: hsl(33 60% 50%);
  --filled-color: hsl(40, 60%, 88%);
  --filled-hovered: hsl(33 68% 54%);
  --filled-pressed: hsl(33 72% 60%);
  --filled-ripple: hsl(33, 60%, 70%);
  --filled-shadow: hsl(33, 32%, 30%);

  --ripple: hsl(33, 80%, 74%);
  --button-hover: hsl(40, 70%, 90%);

  --disabled: hsl(32, 34%, 68% / 0.8);
  --disabled-text: hsl(32, 20%, 60% / 0.6);
  --disabled-outline: hsl(32, 20%, 40% / 0.4);
  `
    },
    ["Warm Dark"]: {
      "description": "A dark theme with warm tones for a soothing design; welcome to the dark side.",
      "value": `
  color-scheme: dark;

  /* palette */
  --primary: hsl(18 24% 20% / 1);
  --primary-100: hsl(16 18% 18%);
  --primary-200: hsl(16 18% 22%);
  --primary-300: hsl(16 18% 28%);
  --primary-shadow: hsl(16, 20%, 30%, 32%);
  --primary-opaque: hsl(22 26% 64% / 0.8);

  --secondary: hsl(32 72% 75% / 1);
  --secondary-100: hsl(32 66% 68% / 1);
  --secondary-200: hsl(32 62% 62% / 1);
  --secondary-300: hsl(32 44% 76% / 1);
  --secondary-shadow: hsl(32 34% 70% / 72%);

  --hovered: hsl(16 18% 18%);
  --pressed: hsl(16 18% 22%);

  --tonal: hsl(16 18% 26%);
  --tonal-hovered: hsl(16, 18%, 32%);
  --tonal-pressed: hsl(16, 20%, 38%);
  --tonal-ripple: hsl(16, 76%, 68%);
  --tonal-shadow: hsl(16, 50%, 30%, 80%);
  --tonal-outline: hsl(22 100% 74%);

  --elevated: hsl(16 16% 16%);
  --elevated-hovered: hsl(16 10% 20%);
  --elevated-pressed: hsl(16 12% 24%);
  --elevated-shadow-front: hsl(16, 40%, 14%, 80%);
  --elevated-shadow-back: hsl(16, 20%, 20%, 30%);

  --accent: hsl(16, 80%, 70%);

  --background: hsl(22 14% 7%);
  --surface: hsl(16 12% 10%);
  --overlay-shadow: transparent;
  --on-surface: hsl(22 10% 14%);

  --text: hsl(22 100% 92%);
  --text-primary: hsl(16, 10%, 85%);
  --text-tonal: hsl(22 100% 84%);
  --button-text: hsl(22 100% 84%);

  --filled: hsl(32 72% 75% / 1);
  --filled-color: hsl(22 44% 14%);
  --filled-hovered: hsl(32 66% 68% / 1);
  --filled-pressed: hsl(32 62% 62% / 1);
  --filled-ripple: hsl(32 36% 14% / 1);
  --filled-shadow: hsl(32 16% 24% / 1);

  --ripple: hsl(32 34% 66% / 1);
  --button-hover: hsl(32 18% 16% / 1);

  --disabled: hsl(16 8% 16% / 0.6);
  --disabled-text: hsl(22 20% 60% / 0.4);
  --disabled-outline: hsl(22 10% 40% / 0.25);
  `
    }
  },
  iconAxeConfig: ':opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
  themeList: function () {
    return Object.keys(this.theme);
  },
  getAllThemes: function () {
    return this.theme;
  }
};

(() => {
  // theme initializer 
  const storedTheme = localStorage.getItem('theme');

  if (storedTheme) {
    document.documentElement.setAttribute('data-theme', storedTheme);
  } else {
    const prefersDarkmode = window.matchMedia('prefers-color-scheme: dark').matches;

    document.documentElement.setAttribute('data-theme', (prefersDarkmode ? 'Warm Dark' : 'Warm Light'));
  }

  const themeStyles = document.createElement('style');

  Object.entries(app.theme).forEach(([themeName, themeObject]) => {
    themeStyles.innerHTML += `[data-theme="${themeName}"] { ${themeObject.value} }\n`;

    document.body.appendChild(themeStyles);
  });
})();

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    const requestFullscreen =
      document.documentElement.requestFullscreen ||
      document.documentElement.mozRequestFullScreen ||
      document.documentElement.webkitRequestFullscreen ||
      document.documentElement.msRequestFullscreen;

    if (requestFullscreen) requestFullscreen.call(document.documentElement);
  } else {
    const exitFullscreen =
      document.exitFullscreen ||
      document.mozCancelFullScreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen;

    if (exitFullscreen) exitFullscreen.call(document);
  }
}

async function getUsedIcons() {
  const icons = document.querySelectorAll('.icon');
  let iconList;
  if (icons) {
    iconList = new Set();
    icons.forEach((item) => {
      if (!iconList.has(item.innerHTML.trim())) {
        iconList.add(item.innerHTML.trim());
      }
    });
  }

  return iconList;
}

async function injectIcon() {
  const iconStyle = document.createElement('link');

  const iconList = await getUsedIcons();

  let e = Object.prototype.toString.call(iconList) === '[object Set]' ? '' : '&icon_names=';

  const iconNames = Array.from(iconList).sort().join(',');
  const queryString = `&icon_names=${iconNames}`;

  iconStyle.setAttribute('href', `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded${app.iconAxeConfig}${queryString}`);
  iconStyle.setAttribute('rel', 'stylesheet');

  document.body.appendChild(iconStyle);
};

function renderMD(source) {
  console.log(`Source:\n${source}`);
  const mappedMD = {
    italic: /\*(.*?)\*/g,
    bold: /\*\*(?!\*.*\*\*)(.*?)\*\*/g
  };

  function replaceDelimiters(source, target, by) {
    return target.test(source) ? source.replace(target, by) : source;
  };

  source = replaceDelimiters(source, mappedMD.bold, `<b>$1</b>`);
  source = replaceDelimiters(source, mappedMD.italic, `<i>$1</i>`);

  console.log(`Output:\n${source}`);
  return source;
};

// ---

const mediaSmallPhone = 384;
const mediaPhone = 768;

const appBody = document.querySelector('#app');
const menuButton = document.querySelector('#menu-button');
const appNavigationWrapper = document.querySelector('#app-navigation-wrapper');
const appNavigation = document.querySelector('#app-navigation');
const backdrop = document.querySelector('#backdrop');
const themeSelection = document.querySelector('#theme-selection');

themeSelection.innerHTML = '';


const configDB = indexedDB.open("config");

(async () => {
  for (const item of app.themeList()) {
    const theme = document.createElement('c-button');
    theme.innerHTML = item;

    themeSelection.appendChild(theme);

    theme.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', item);
      localStorage.setItem('theme', item);
    });

    await new Promise(resolve => setTimeout(resolve, 0));
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const hamburgerMenu = document.querySelector('#menu-button .icon');
  if (Math.random() <= 0.01) {
    hamburgerMenu.innerText = '🍔';
    hamburgerMenu.style.paddingBottom = '8px';
  }
})



function displayBackdrop(display) {
  if (display) {
    if (backdrop.classList.contains('close') || !backdrop.classList.contains('show')) {
      backdrop.classList.add('show');
      backdrop.classList.remove('close');
    }
  } else {
    backdrop.classList.remove('show');
    backdrop.classList.add('close');
  }
}


function toggleMenu() {
  const close = 'close-app-navigation';
  const open = 'open-app-navigation';

  if (window.innerWidth >= mediaPhone) {
    if (appBody.classList.contains(close)) {
      appBody.classList.remove(close);
      appBody.classList.add(open);
      appNavigationWrapper.removeAttribute('inert', '');

      displayBackdrop(false);
    } else {
      appBody.classList.add(close);
      appBody.classList.remove(open);
      appNavigationWrapper.setAttribute('inert', '');

      displayBackdrop(false);
    }
  } else {
    if (appBody.classList.contains(open)) {
      appBody.classList.remove(open);
      appBody.classList.add(close)
      appNavigationWrapper.setAttribute('inert', '');

      displayBackdrop(false);
    } else {
      appBody.classList.remove(close);
      appBody.classList.add(open);
      appNavigationWrapper.removeAttribute('inert', '');

      displayBackdrop(true);
    }
  }
}

menuButton.addEventListener('click', () => {
  toggleMenu();
}, { passive: true });

backdrop.addEventListener('click', () => {
  if (appBody.classList.contains('open-app-navigation')) {
    appBody.classList.remove('open-app-navigation');
    appBody.classList.add('close-app-navigation')
    appNavigationWrapper.setAttribute('inert', '');

    displayBackdrop(false);
  }
}, { passive: true });

document.addEventListener('resize', () => {
  const close = 'close-app-navigation';
  const open = 'open-app-navigation';

  if (window.innerWidth <= mediaPhone) {
    if (appBody.classList.contains(close)) {
      appBody.classList.remove(close);
      appBody.classList.add(open);
      appNavigationWrapper.removeAttribute('inert', '');
    } else {
      appBody.classList.add(close);
      appBody.classList.remove(open);
      appNavigationWrapper.setAttribute('inert', '');
    }
  }
}, { passive: true })

injectIcon();

const shortcuts = {
  'save': 'ctrl + s',
  'toggle menu': 'ctrl + m',
  'toggle settings': 'alt + m'
};

window.addEventListener('keydown', (event) => {
  const pressedKeys = [];
  if (event.ctrlKey && event.key !== 'Control') pressedKeys.push('ctrl');
  if (event.altKey && event.key !== 'Alt') pressedKeys.push('alt');
  if (event.key && event.key !== 'Control' && event.key !== 'Alt') {
    pressedKeys.push(event.key.toLowerCase());
  }

  const shortcutPressed = pressedKeys.join(' + ');

  if (Object.values(shortcuts).includes(shortcutPressed)) {
    event.preventDefault();
  }
  console.log(shortcutPressed);

  switch (shortcutPressed) {
    case shortcuts['save']:
      event.preventDefault();
      console.log('save');
      break;
    case shortcuts['toggle menu']:
      event.preventDefault();
      console.log('toggle menu');
      toggleMenu();
      break;
    case shortcuts['toggle settings']:
      event.preventDefault();
      console.log('toggle settings');
      break;
    default:
      break;
  }
});






// Elements
const body = document.body;
const chatContainer = document.querySelector('#chat-container');
const chatPicker = document.querySelector('#chat-picker');
const customChatName = document.querySelector('#custom-chat-name');
const customChatChannel = document.querySelector('#custom-chat-channel');
const addCustomChatButton = document.querySelector('#add-custom-chat-button');
const editButton = document.querySelector('#edit-button');

// Events

const system = {
  mode: 'normal',
  setMode: (mode) => {
    system.mode = mode;
    body.setAttribute('data-mode', mode);

    updateChatInterface();
  }
};

// The array of global chats to be available by default
const chats = [
  {
    type: 'system',
    name: 'General',
    channel: 'general'
  },
  {
    type: 'system',
    name: 'Feedback',
    channel: 'feedback'
  },
  {
    type: 'system',
    name: 'Support',
    channel: 'support'
  }
];
// An empty array to populate it with custom chat objects later
let customChats = [];

let savedCustomChats = JSON.parse(localStorage.getItem('saved-custom-chats'));

if (savedCustomChats) {
  customChats = savedCustomChats;
}
editButton.addEventListener('click', () => {
  if (system.mode !== 'editing') {
    system.setMode('editing');
  } else {
    system.setMode('normal');
  }
});
customChatChannel.oninput = () => {
  const input = customChatChannel;
  const caretPosition = input.selectionStart;
  input.value = slugify(input.value);
  input.setSelectionRange(caretPosition, caretPosition);

  searchForDuplicate(input.value);
};






function slugify(source) {
  return source.toLowerCase().replace(/[^a-z0-9]/g, '-');
};
function openChat(item) {
  if (window.location.href.includes('perchance.org/custom-chat')) {
    customChat.channel = item.channel;
    update();
  } else {
    console.log(`\n\n$ Open chat\nName: ${item.name}\nChannel: ${item.channel}\n\n`)
  }
};
function removeChat(card, item) {
  const index = customChats.indexOf(item);

  if (index !== -1) {
    customChats.splice(index, 1);
    card.remove();
    localStorage.setItem('saved-custom-chats', JSON.stringify(customChats));
  }
}
function createChat(item) {
  let card;
  if (system.mode === 'editing') {
    card = document.createElement('div');
  } else {
    card = document.createElement('c-button');
  }
  const name = document.createElement('h4');
  const channel = document.createElement('div');

  if (system.mode !== 'editing') {
    name.innerText = item.name;
  } else {
    const input = document.createElement('input');
    input.name = 'chat-name'
    input.value = item.name;

    input.oninput = () => {
      item.name = input.value;
      localStorage.setItem('saved-custom-chats', JSON.stringify(customChats));
    }

    name.appendChild(input);
  }

  if (system.mode !== 'editing') {
    channel.innerText = item.channel;
  } else {
    const input = document.createElement('input');
    input.name = 'chat-channel'
    input.value = item.channel;

    input.oninput = () => {
      const caretPosition = input.selectionStart;
      item.channel = slugify(input.value);
      input.value = slugify(input.value);
      input.setSelectionRange(caretPosition, caretPosition);
      localStorage.setItem('saved-custom-chats', JSON.stringify(customChats));
    }

    channel.appendChild(input);
  }

  card.classList.add('card');
  name.classList.add('name');
  channel.classList.add('channel');

  card.appendChild(name);
  card.appendChild(channel);

  if (system.mode !== 'editing') {
    card.addEventListener('click', () => openChat(item));
  } else {
    const deleteButton = document.createElement('c-button');
    card.classList.add('editing');
    deleteButton.innerText = 'Delete';
    deleteButton.addEventListener('click', () => removeChat(card, item));

    card.appendChild(deleteButton);
  }

  chatPicker.appendChild(card);
};

function updateChatInterface() {
  chatPicker.innerHTML = '';

  if (system.mode !== 'editing') {
    chats.forEach((item) => createChat(item));
  }
  customChats.forEach((item) => createChat(item));
};
function searchForDuplicate(channel) {
  const userAlert = document.querySelector('#user-alert');
  const isDuplicate = customChats.some(chat => chat.channel === channel);

  if (isDuplicate) {
    userAlert.hidden = false;
    userAlert.innerHTML = `You can't create multiple chats with the same channel. The chat with the channel '${channel}' is already defined.`;
  } else {
    userAlert.hidden = true;
  }
};








updateChatInterface();

addCustomChatButton.addEventListener('click', () => {

  const customChatObject = {
    version: 1,
    type: 'custom',
    name: customChatName.value,
    channel: customChatChannel.value,
    token: crypto.randomUUID(),
    timestamp: new Date().getTime(),
    modified: null,
    records: []
  };

  customChats.push(customChatObject);
  localStorage.setItem('saved-custom-chats', JSON.stringify(customChats));

  createChat(customChatObject);
});

// Create a broadcast channel (use the same name across all tabs)
const channel = new BroadcastChannel('crossTabLogChannel');

// Function to log messages in all tabs
function logAcrossTabs(message) {
  channel.postMessage({ type: 'log', message });
}

// Listen for messages in all tabs (including the sender)
channel.onmessage = (event) => {
  if (event.data.type === 'log') {
    console.log('Logged in all tabs:', event.data.message);
  }
};