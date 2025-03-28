if (window.location.href.includes('perchance.org/custom-chat')) {
  document.querySelector('base').href += 'custom-chat';
}
const elements = {
  navigation: document.querySelector('#app-navigation'),
  chat: {
    add: document.querySelector('#custom-chat-open-modal'),
    picker: document.querySelector('#chat-picker'),
    heading: document.getElementById('display-channel-name'),
    container: document.querySelector('#chat-container'),
    share: document.getElementById('share-modal'),
  },
  __customChatModal__: document.querySelector('#custom-chat-modal'),
  get customChatModal() {
    return this.__customChatModal__;
  },
  __toolbar__: document.querySelector('#app-toolbar'),
  get toolbar() {
    return this.__toolbar__;
  },
};
elements.toolbar.add = elements.toolbar.querySelector('.add-custom-chat-button-small');
elements.toolbar.share = elements.toolbar.querySelector('#share')
elements.customChatModal.nameInput = elements.customChatModal.querySelector('#custom-chat-name');
elements.customChatModal.highlight = elements.customChatModal.querySelector('p.highlight');
elements.customChatModal.addButton = elements.customChatModal.querySelector('.add');

const chats = [
  {
    type: 'system',
    name: 'Home',
    channel: 'home'
  },
  {
    type: 'system',
    name: 'Living Room',
    channel: 'living-room'
  },
  {
    type: 'system',
    name: 'Share Chats',
    channel: 'share-chats'
  },
  {
    type: 'system',
    name: 'Feedback',
    channel: 'feedback'
  }
];
let chatsStack = [];
const system = {
  currentChat: undefined,
  db: undefined,
  channel: new BroadcastChannel('system'),
  add: (customChat) => {
    return new Promise((resolve, reject) => {
      const transaction = system.db.transaction('customChats', 'readwrite');
      const store = transaction.objectStore('customChats');
      const request = store.add(customChat);

      request.onerror = (event) => reject(event.target.error);
      transaction.onabort = (event) => reject(event.target.error);
      transaction.oncomplete = () => resolve('Chat added successfully.');
    });
  },
  load: () => {
    return new Promise((resolve, reject) => {
      const transaction = system.db.transaction('customChats', 'readonly');
      const store = transaction.objectStore('customChats');
      const request = store.getAll();

      request.onerror = (event) => {
        reject('Error in loading chats: ' + event.target.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      transaction.onabort = (event) => {
        reject(event.target.error);
      };
    });
  },
  get: (key) => {
    return new Promise((resolve, reject) => {
      const transaction = system.db.transaction('customChats', 'readonly');
      const store = transaction.objectStore('customChats');
      const request = store.get(key);

      request.onerror = (event) => {
        reject('Error in loading chat: ' + event.target.error);
      };
      transaction.onabort = (event) => {
        reject(event.target.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  },
  delete: (channel) => {
    const transaction = system.db.transaction('customChats', 'readwrite');
    const store = transaction.objectStore('customChats');

    store.delete(channel);
  }
}
function numericUUID() {
  const uuid = crypto.randomUUID();
  const pattern = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return uuid.split('').map(characters => {
    if (/[A-Za-z]/.test(characters)) {
      return pattern.indexOf(characters.toUpperCase()) + 1;
    }
    return characters;
  }).join('');
}
class CustomChat {
  constructor(name, channel, timestamp) {
    if (!name) {
      throw 'Name cannot be empty.';
    } else if (!name.trim()) {
      throw 'Name cannot be only whitespaces.';
    } else if (typeof name !== 'string') {
      throw 'Name must be a string.';
    }

    this.id = numericUUID();
    this.version = 'v1.0.0';
    /* This is the type. I defined a type to distinguish
     this from the system chats that are predefined. */
    this.type = 'custom';
    /* This is the name of the channel, it serves no
    purpose other than customizeability. */
    this.name = name;
    /* This is the channel, and this is the real thing that
    distinguishes one chat from another.
    A channel here is a randomly generated unique ID, the reason
    I had to use this is because every chat is public, and
    the unique ID makes sure no one can just randomly
    access a private chat. */
    this.channel = channel || crypto.randomUUID();
    this.timestamp = timestamp || Date.now();
    this.modified = null;
    this.records = [];
  }
}
function slugify(source) {
  return source.toLowerCase().replace(/[^a-z0-9]/g, '-');
}
function openChat(chat) {
  const event = new Event('open-chat');
  event.chatType = chat.type;
  event.channel = chat.channel;
  system.currentChat = chat;

  window.dispatchEvent(event);

  if (window.location.href.includes('perchance.org/custom-chat')) {
    if (customChannel !== chat.channel) {
      customChannel = chat.channel;
      customLabel = chat.name;
      elements.chat.container.innerHTML = __c__(custom);
    }
  } else {
    console.log(`\n\n$ Open chat\nName: ${chat.name}\nChannel: ${chat.channel}\n\n`)
  }
  elements.chat.heading.innerText = chat.name;
  document.querySelector("body > h1").innerText = chat.name;
  document.title = chat.name;
}
function renderChat(chat) {
  const modal = document.createElement('dialog', { is: 'c-modal' });
  const modalElements = {
    controls: {
      delete: document.createElement('button'),
      close: document.createElement('button'),
      name: document.createElement('input'),
      share: document.createElement('button'),
    },
    contentWrapper: document.createElement('div'),
    content: document.createElement('div'),
    action: document.createElement('div'),
    channel: document.createElement('p'),
  }

  modal.ariaLabel = 'Edit ' + chat.name + ' Chat'
  modal.setAttribute('variant', 'content-action');
  modal.append(modalElements.contentWrapper);

  modalElements.contentWrapper.append(modalElements.content);
  modalElements.contentWrapper.append(modalElements.action);

  modalElements.contentWrapper.classList.add('overflow-auto');
  modalElements.contentWrapper.classList.add('flex-column');
  modalElements.action.classList.add('flex-row');
  modalElements.action.classList.add('flex-*1');
  modalElements.action.classList.add('action');

  modalElements.content.classList.add('content');

  modalElements.controls.name.value = chat.name;

  modalElements.content.appendChild(modalElements.controls.name);
  modalElements.content.appendChild(modalElements.channel);
  modalElements.action.appendChild(modalElements.controls.close);

  if (chat.type !== 'system') {
    modalElements.action.appendChild(modalElements.controls.share);
  }

  const card = document.createElement('div');
  const button = document.createElement('a');
  const editButton = document.createElement('button');
  const icon = document.createElement('mat-icon');
  const editIcon = document.createElement('mat-icon');
  const name = document.createElement('div');

  const nameInput = document.createElement('input');
  const channelInput = document.createElement('input');

  card.classList.add('card');
  button.type = 'button';
  button.role = 'button';
  button.classList.add('main-button');

  if (system.currentChat === chat) {
    button.classList.add('active');
  }

  button.ariaLabel = chat.name || 'Unknown Chat';
  name.classList.add('name');
  button.href = '?open=' + (chat.id ?? chat.channel);

  editButton.type = 'button';
  editButton.classList.add('edit-button');
  editButton.classList.add('icon-button');
  editButton.ariaLabel = 'Edit ' + chat.name;

  name.innerText = chat.name;
  icon.classList.add('card-icon');
  icon.innerText = 'forum';
  editIcon.innerText = 'tune';

  nameInput.name = 'chat-name'
  nameInput.placeholder = 'Chat name'
  nameInput.value = chat.name;

  channelInput.name = 'chat-channel'
  channelInput.placeholder = 'Chat channel'
  channelInput.value = chat.channel;

  button.appendChild(icon);
  button.appendChild(name);
  editButton.appendChild(editIcon);

  modalElements.controls.close.innerText = 'Close';
  modalElements.controls.share.innerText = 'Share';

  card.appendChild(button);
  card.appendChild(editButton);
  card.appendChild(modal);

  modalElements.controls.delete.innerText = 'Delete';

  if (chat.type !== 'system') {
    modalElements.action.appendChild(modalElements.controls.delete);
  }

  window.addEventListener('open-chat', (event) => {
    if (button.classList.contains('active')) {
      button.classList.remove('active');
    }

    if (event.channel === chat.channel) {
      button.classList.add('active');
    }
  })
  nameInput.addEventListener('input', () => {
    chat.name = nameInput.value;
    name.innerText = nameInput.value;
  });
  button.addEventListener('keydown', (event) => {
    if (event.key == ' ') {
      event.preventDefault();
      openChat(chat);
    }
  });
  button.addEventListener('click', (event) => {
    if (!event.ctrlKey) {
      event.preventDefault();
      openChat(chat);
    }
  });
  modalElements.controls.close.addEventListener('click', () => modal.closeModal())
  modalElements.controls.delete.addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete "${chat.name}" chat?`)) {
      modal.closeModal();
      card.remove();
      system.delete(chat.channel);
    }
  });
  modalElements.controls.share.addEventListener('click', () => {
    const a = document.createElement('a');

    a.href = `?import=${encodeURIComponent(JSON.stringify(chat))}`;
    a.innerText = chat.name;
    modalElements.content.appendChild(a);
  })
  editButton.addEventListener('click', () => modal.openModal());

  elements.chat.picker.appendChild(card);
}
function renderInterface() {
  elements.chat.picker.innerHTML = '';

  chats.forEach((chat) => renderChat(chat));
  chatsStack.forEach((chat) => renderChat(chat));
}
const systemDBOpenRequest = indexedDB.open('systemDB', 2);
systemDBOpenRequest.onerror = (event) => {
  console.error('Database error:', event);
};
systemDBOpenRequest.onsuccess = (event) => {
  system.db = event.target.result;

  const openKey = new URLSearchParams(location.search).get('open');

  if (openKey) {
    const isID = /^(?=(?:[^-]*-){4,})[0-9-]{32,}$/.test(openKey);

    if (isID) {
      system.get(openKey)
        .then(chat => openChat(chat))
        .catch(error => alert(`Chat not found, make sure you have the proper access URL, and that the chat already exists in your device.`));
    } else {
      const chat = chats.find(chat => chat.channel === openKey);
      try {
        openChat(chat);
      } catch {
        alert(`Chat not found, make sure you have the proper access URL, and that the chat already exists in your device.`)
      }
    }
  }

  system.load()
    .then(chats => {
      if (chatsStack.length == 0) {
        chatsStack = chats;
      } else {
        for (const chat of chats) {
          if (!chatsStack.some(existingChat => existingChat.channel === chat.channel)) {
            chatsStack.push(chat);
          }
        }
      }
      renderInterface();
    })
    .catch(error => {
      console.error('Error loading chats:', error);
    });
};
systemDBOpenRequest.onupgradeneeded = (event) => {
  const db = event.target.result;

  if (db.objectStoreNames.contains('customChats')) {
    db.deleteObjectStore('customChats');
    db.createObjectStore('customChats', { keyPath: 'id' });
  } else {
    db.createObjectStore('customChats', { keyPath: 'id' });
  }
};
elements.chat.add.addEventListener('click', () => {
  elements.customChatModal.openModal();
}, { passive: true });
elements.toolbar.add.addEventListener('click', () => {
  elements.customChatModal.openModal();
}, { passive: true });
let customChat;
elements.customChatModal.nameInput.addEventListener(('input'), () => {
  if (elements.customChatModal.nameInput.value.trim() !== '') {
    elements.customChatModal.addButton.disabled = false;
  } else {
    elements.customChatModal.addButton.disabled = true;
  }
  try {
    customChat = new CustomChat(elements.customChatModal.nameInput.value);
    elements.customChatModal.highlight.innerText = `Channel:\n${customChat.channel}\nLocal ID:\n${customChat.id}`;
    elements.customChatModal.highlight.style.color = '';
    elements.customChatModal.highlight.style.fontFamily = 'var(--font-mono)';
  } catch (error) {
    elements.customChatModal.highlight.innerText = error;
    elements.customChatModal.highlight.style.color = 'var(--error)';
    elements.customChatModal.highlight.style.fontFamily = '';
  }
}, { passive: true });
elements.customChatModal.addButton.addEventListener('click', () => {
  system.add(customChat)
    .then(() => {
      elements.customChatModal.closeModal();
      elements.customChatModal.nameInput.value = '';
      elements.customChatModal.nameInput.dispatchEvent(new Event('input'));
      elements.customChatModal.highlight.innerText = '';
      elements.customChatModal.highlight.style.color = '';
      elements.customChatModal.highlight.style.fontFamily = '';

      renderChat(customChat);
    })
    .catch(error => {
      elements.customChatModal.highlight.innerText = `Error adding chat:\n${error}`;
      elements.customChatModal.highlight.style.color = 'var(--error)';
      elements.customChatModal.highlight.style.fontFamily = '';
      console.error('Error adding chat:', error);
    });
}, { passive: true });
elements.customChatModal.addEventListener('click', (event) => {
  if (event.target === elements.customChatModal) {
    elements.customChatModal.closeModal();
  }
}, { passive: true });
elements.customChatModal.querySelector('button.close-button').addEventListener('click', () => {
  elements.customChatModal.closeModal();
}, { passive: true });

const comments = [
  {
    "message": "Checking feedback channel. ✅",
    "channel": "feedback",
    "time": 1737642153006,
    "user": {
      "isAdmin": true,
      "id": "bd9702c1db6ae669c7b6",
      "visualId": "9jx0",
      "nickname": "",
      "avatarUrl": null
    },
    "id": "679250a9cb0a720ad459220a",
    "byCurrentUser": false,
    "autoSent": false
  },
  {
    "message": "I forgot the password. 🤦",
    "channel": "feedback",
    "time": 1738525877005,
    "user": {
      "isAdmin": false,
      "id": "5df291a4941a6a448e3d",
      "visualId": "ujfe",
      "name": "cocell",
      "nickname": "",
      "avatarUrl": null
    },
    "id": "679fccb5eb40c00ad3ccee09",
    "byCurrentUser": false,
    "autoSent": false
  },
  {
    "message": "Nvm. ",
    "channel": "feedback",
    "time": 1738525924938,
    "user": {
      "isAdmin": true,
      "id": "5df291a4941a6a448e3d",
      "visualId": "ujfe",
      "name": "cocell",
      "nickname": "",
      "avatarUrl": null
    },
    "id": "679fcce4eb40c00ad3ccee54",
    "byCurrentUser": false,
    "autoSent": false
  },
  {
    "message": "Cocell- js a suggestion, can we have like a kinda like 'send messages privately thing' where you can send a message to somebody and nobody else can see it, like for making pcs for example, to stop the 'breaking into pcs' issue?",
    "channel": "feedback",
    "time": 1738527746910,
    "user": {
      "isAdmin": false,
      "id": "fb874c1a7d8c2de9f597",
      "visualId": "kibn",
      "name": "rucilia",
      "nickname": "",
      "avatarUrl": null
    },
    "id": "679fd402eb40c00ad3ccf711",
    "byCurrentUser": false,
    "autoSent": false
  },
  {
    "message": "YOU SILLY GOOBER- /jkjk",
    "channel": "feedback",
    "time": 1738529825153,
    "user": {
      "isAdmin": false,
      "id": "fb874c1a7d8c2de9f597",
      "visualId": "kibn",
      "name": "rucilia",
      "nickname": "",
      "avatarUrl": null
    },
    "id": "679fdc21eb40c00ad3cd0202",
    "byCurrentUser": false,
    "replyingTo": "679fccb5eb40c00ad3ccee09",
    "replyingToData": {
      "folderName": "custom-chat+feedback",
      "message": "I forgot the password. 🤦",
      "messageId": "679fccb5eb40c00ad3ccee09",
      "publicId": "5df291a4941a6a448e3d",
      "selfDeclaredHistorialPublicIds": [],
      "time": 1738525877005,
      "userNickname": null,
      "userAvatarUrl": null,
      "username": "cocell"
    },
    "autoSent": false
  },
  {
    "message": "So, the current plugin does not support these features. But theoretically, it could be achieved by encrypting your message, which would then be decrypted in the other person's device. However, this is very inefficient, since an encrypted message is incredibly long, there is a high probability that it won't even fit inside the text limit of a message.",
    "channel": "feedback",
    "time": 1738555160404,
    "user": {
      "isAdmin": true,
      "id": "bd9702c1db6ae669c7b6",
      "visualId": "9jx0",
      "nickname": "Coc̀éll",
      "avatarUrl": null
    },
    "id": "67a03f18eb40c00ad3cdaf8b",
    "byCurrentUser": false,
    "replyingTo": "679fd402eb40c00ad3ccf711",
    "replyingToData": {
      "folderName": "custom-chat+feedback",
      "message": "Cocell- js a suggestion, can we have like a kinda like 'send messages privately thing' where you can send a message to somebody and nobody else can see it, like for making pcs for example, to stop the 'breaking into pcs' issue?",
      "messageId": "679fd402eb40c00ad3ccf711",
      "publicId": "fb874c1a7d8c2de9f597",
      "selfDeclaredHistorialPublicIds": [],
      "time": 1738527746910,
      "userNickname": null,
      "userAvatarUrl": null,
      "username": "rucilia"
    },
    "autoSent": false
  },
  {
    "message": "e",
    "channel": "feedback",
    "time": 1738574311575,
    "user": {
      "isAdmin": true,
      "id": "2fba3e4fb46897dc6897",
      "visualId": "mhah",
      "nickname": "Coc̀éll",
      "avatarUrl": "https://user-uploads.perchance.org/file/287841fdb0439bd3a1c9d03282fd8a8f.jpg"
    },
    "id": "67a089e7eb40c00ad3ce0e26",
    "byCurrentUser": false,
    "autoSent": false
  }
];
// comments.forEach((comment) => {
//   const container = document.querySelector("#chat-container > div");
//   const commentElement = document.createElement('div');
//   const commentUsername = document.createElement('button');
//   const commentMessage = document.createElement('p');

//   commentUsername.innerText = comment.user.nickname || comment.user.visualId.toUpperCase();
//   commentMessage.innerText = comment.message;
//   commentElement.style.textAlign = 'justify';

//   commentElement.appendChild(commentUsername);
//   commentElement.appendChild(commentMessage);
//   container.appendChild(commentElement);
// }, { passive: true });
elements.chat.picker.addEventListener('focusin', () => {
  SpatialNavigation.add('chat-picker', {
    selector: '#chat-picker a, #chat-picker button',
    leaveFor: {
      left: "#app-toolbar > button",
    }
  });
}, { passive: true });
elements.chat.picker.addEventListener('focusout', () => {
  SpatialNavigation.remove('chat-picker');
}, { passive: true });

// settings.$.addEventListener('focusin', () => {
//   SpatialNavigation.add('settings', {
//     selectors: 'button'
//   });
// });
// settings.$.addEventListener('focusout', () => {
//   SpatialNavigation.remove('settings');
// });

elements.chat.picker.addEventListener('keydown', (e) => {
  let links = elements.chat.picker.querySelectorAll('a');
  if (!links.length) return;

  if (document.activeElement === links[0] && e.key === 'ArrowUp') {
    elements.chat.picker.parentElement.scrollTop = 0;
  } else if (document.activeElement === links[links.length - 1] && e.key === 'ArrowDown') {
    elements.chat.picker.parentElement.scrollTop = elements.chat.picker.parentElement.scrollHeight;
  }
}, { passive: true });

document.documentElement.setAttribute('data-theme', 'Warm Dark');

const importChat = new URLSearchParams(location.search).get('import');

if (importChat) {
  const importedChat = JSON.parse(importChat)
  const chat = new CustomChat(importedChat.name, importedChat.channel, importedChat.timestamp);

  system.add(chat);
  renderChat(chat);
  openChat(chat);
}

window.addEventListener('open-chat', (e) => {
  if (e.chatType == 'custom') {
    elements.toolbar.share.hidden = false;
  } else {
    elements.toolbar.share.hidden = true;
  }
}, { passive: true });

elements.chat.share.querySelector('button.close-button').addEventListener('click', () => elements.chat.share.closeModal());
elements.toolbar.share.addEventListener('click', () => {
  const link = elements.chat.share.querySelector('a');
  const chat = {
    name: system.currentChat.name,
    channel: system.currentChat.channel,
    timestamp: system.currentChat.timestamp,
  }

  link.href = '?import=' + encodeURIComponent(JSON.stringify(chat));
  link.innerText = 'Share ' + chat.name;
  elements.chat.share.openModal();

}, { passive: true });
