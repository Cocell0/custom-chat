// # app.js

const mediaSmallPhone = 384;
const mediaPhone = 768;

const settings = {
  $: document.getElementById('settings'),
  fullscreen: document.getElementById('settings').querySelector('button.fullscreen')
}

const body = document.body;
const appBody = document.querySelector('#app');
const menuButton = document.querySelector('#menu-button');
const appNavigationWrapper = document.querySelector('#app-navigation-wrapper');
const appNavigation = document.querySelector('#app-navigation');
const themeSelection = document.querySelector('#theme-selection');

const app = {
  themes: [
    {
      name: 'Warm Light',
      description: 'A light theme with warm tones for a cozy and inviting design.'
    },
    {
      name: 'Warm Dark',
      description: 'A dark theme with warm tones for a soothing design; welcome to the dark side.'
    },
    {
      name: 'Nightly Garden',
      description: 'A dark theme with warm and soft toned colors.'
    },
    {
      name: 'Table Dark',
      description: "A dark theme with cool, blue and purple shades."
    }
  ],
  iconAxeConfig: ':opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
};

const lastTheme = localStorage.getItem('lastTheme');

if (lastTheme) {
  document.documentElement.setAttribute('data-theme', lastTheme);
} else {
  const prefersDarkmode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  document.documentElement.setAttribute('data-theme', (prefersDarkmode ? 'Warm Dark' : 'Warm Light'));
}

themeSelection.innerHTML = '';


app.themes.forEach((theme) => {
  const themeButton = document.createElement('button');
  themeButton.innerHTML = theme.name;
  themeButton.ariaLabel = 'Choose Theme ' + theme.name;

  themeSelection.append(themeButton);

  themeButton.addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme', theme.name);
    localStorage.setItem('lastTheme', theme.name);
  });
});

function fullscreen(element) {
  if (!document.fullscreenElement) {
    const requestFullscreen =
      element.requestFullscreen ||
      element.mozRequestFullScreen ||
      element.webkitRequestFullscreen ||
      element.msRequestFullscreen;

    if (requestFullscreen) requestFullscreen.call(element);
  } else {
    const exitFullscreen =
      document.exitFullscreen ||
      document.mozCancelFullScreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen;

    if (exitFullscreen) exitFullscreen.call(document);
  }
};
settings.fullscreen.addEventListener('click', () => {
  settings.$.closeModal();
  fullscreen(document.documentElement);
});

function getUsedIcons() {
  const icons = document.querySelectorAll('mat-icon');
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

const iconStyle = document.createElement('link');
document.body.appendChild(iconStyle);

function injectIcon() {
  const iconList = getUsedIcons();

  const iconNames = Array.from(iconList).sort().join(',');
  const queryString = `&icon_names=${iconNames}`;
  iconStyle.setAttribute('rel', 'stylesheet');

  if (iconStyle.getAttribute('href') !== `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded${app.iconAxeConfig}${queryString}`) {
    iconStyle.setAttribute('href', `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded${app.iconAxeConfig}${queryString}`)
  }
}

function renderMD(source) {
  console.log(`Source:\n${source}`);
  const mappedMD = {
    italic: /\*(.*?)\*/g,
    bold: /\*\*(?!\*.*\*\*)(.*?)\*\*/g
  }

  function replaceDelimiters(source, target, by) {
    return target.test(source) ? source.replace(target, by) : source;
  }

  source = replaceDelimiters(source, mappedMD.bold, `<b>$1</b>`);
  source = replaceDelimiters(source, mappedMD.italic, `<i>$1</i>`);

  console.log(`Output:\n${source}`);
  return source;
}

function getTime(time, timeConfig = {}) {
  const now = Date.now();
  const differenceInMs = now - time;
  const differenceInDays = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));

  const date = new Date(time);
  const nowDate = new Date(now);
  const isToday = date.toDateString() === nowDate.toDateString();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const isPM = date.getHours() >= 12;
  const hour12 = isPM ? (date.getHours() - 12 || 12) : (date.getHours() || 12);
  const hourFormatted = timeConfig.timeFormat === '24-hour' ? hours : String(hour12).padStart(2, '0');
  const timeString = `${hourFormatted}:${minutes} ${isPM ? 'PM' : 'AM'}`;

  if (isToday) {
    return timeString;
  } else if (differenceInDays === 1) {
    return "yesterday";
  } else if (differenceInDays === 2) {
    return "2 days ago";
  } else {
    let formattedDate = timeConfig.dateFormat || 'yyyy/mm/dd';
    formattedDate = formattedDate.replace('yyyy', year).replace('yy', String(year).slice(-2)).replace('mm', month).replace('dd', day);
    return formattedDate;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  SpatialNavigation.init();

  const button = document.querySelector('#menu-button');
  const icon = document.querySelector('#menu-button mat-icon');
  const hamburger = document.createElement('span');
  hamburger.innerText = '🍔';
  hamburger.style.fontSize = '1.5rem';
  hamburger.style.paddingBottom = '4px';

  if (Math.random() <= 0.0005) {
    icon.remove()
    button.appendChild(hamburger);
  }
})

function toggleMenu() {
  const toggle = 'app-navigation-toggle';

  if (appBody.classList.contains(toggle)) {
    if (window.innerWidth <= mediaPhone) {
      appBody.classList.remove(toggle);
      appNavigationWrapper.setAttribute('inert', '');
      appNavigationWrapper.ariaHidden = true;

      app.menuToggle = false;
    } else {
      appBody.classList.remove(toggle);
      appNavigationWrapper.removeAttribute('inert', '');
      appNavigationWrapper.ariaHidden = false;

      app.menuToggle = true;
    }
  } else {
    if (window.innerWidth <= mediaPhone) {
      appBody.classList.add(toggle);
      appNavigationWrapper.removeAttribute('inert', '');
      appNavigationWrapper.ariaHidden = false;

      app.menuToggle = false;
    } else {
      appBody.classList.add(toggle);
      appNavigationWrapper.setAttribute('inert', '');
      appNavigationWrapper.ariaHidden = true;

      app.menuToggle = false;
    }
  }
}

(() => {
  menuButton.addEventListener('click', () => {
    toggleMenu();
  }, { passive: true });

  document.querySelector('#app-navigation-backdrop').addEventListener('click', () => {
    if (appBody.classList.contains(toggle)) {
      appBody.classList.remove(toggle);
      appNavigationWrapper.setAttribute('inert', '');
      appNavigationWrapper.ariaHidden = true;
    }
  }, { passive: true });

  let previousWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const currentWidth = window.innerWidth;
    const toggle = 'app-navigation-toggle';

    if (currentWidth !== previousWidth) {
      if (window.innerWidth <= mediaPhone) {
        appBody.classList.remove(toggle);

        menuButton.focus();
        appNavigationWrapper.setAttribute('inert', '');
        appNavigationWrapper.ariaHidden = true;
      } else {
        appNavigationWrapper.removeAttribute('inert', '');
        appNavigationWrapper.ariaHidden = false;
      }
    }

  }, { passive: true });


  const toggle = 'app-navigation-toggle';

  if (window.innerWidth <= mediaPhone) {
    appNavigationWrapper.setAttribute('inert', '');
    appNavigationWrapper.ariaHidden = true;
  }
})();