// Elements
const elements = {
  navigation: document.querySelector('#app-navigation'),
  chat: {
    add: document.querySelector('#custom-chat-open-modal'),
    heading: document.getElementById('display-channel-name'),
  },
  __customChatModal__: document.querySelector('#custom-chat-modal'),

  get customChatModal() {
    return this.__customChatModal__;
  }
};

elements.customChatModal.nameInput = elements.customChatModal.querySelector('#custom-chat-name');
elements.customChatModal.highlight = elements.customChatModal.querySelector('p.highlight');
elements.customChatModal.addButton = elements.customChatModal.querySelector('.add');

const chatContainer = document.querySelector('#chat-container');
const chatPicker = document.querySelector('#chat-picker');

// The array of global chats to be available by default
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
// An empty array to populate it with custom chat objects later
let chatsStack = [];

const system = {
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

chatPicker.parentElement.addEventListener('scroll', () => {
  if (chatPicker.parentElement.scrollTop >= 100) {
    elements.chat.add.classList.add('hide-text');
  } else {
    elements.chat.add.classList.remove('hide-text');
  }
}, { passive: true })

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
  constructor(name) {
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
    this.channel = crypto.randomUUID();
    this.timestamp = Date.now();
    this.modified = null;
    this.records = [];
  }
}

const systemDBOpenRequest = indexedDB.open('systemDB', 2);

systemDBOpenRequest.onerror = (event) => {
  console.error('Database error:', event);
};
systemDBOpenRequest.onsuccess = (event) => {
  system.db = event.target.result;

  const chatKey = new URLSearchParams(location.search).get('chat');

  if (chatKey) {
    system.get(chatKey)
      .then(chat => openChat(chat))
      .catch(error => console.log(error))
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

function slugify(source) {
  return source.toLowerCase().replace(/[^a-z0-9]/g, '-');
}
function openChat(chat) {
  if (window.location.href.includes('perchance.org/custom-chat')) {
    if (customChannel !== chat.channel) {
      customChannel = chat.channel;
      customLabel = chat.name;
      chatContainer.innerHTML = cp(custom);
    }
  } else {
    console.log(`\n\n$ Open chat\nName: ${chat.name}\nChannel: ${chat.channel}\n\n`)
  }
  elements.chat.heading.innerText = chat.name;
}

function renderChat(chat) {
  const modal = document.createElement('dialog', { is: 'c-modal' });
  const modalElements = {
    controls: {
      delete: document.createElement('button'),
      close: document.createElement('button'),
      name: document.createElement('input'),
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


  const card = document.createElement('div');
  const button = document.createElement('button');
  const editButton = document.createElement('button');
  const icon = document.createElement('mat-icon');
  const editIcon = document.createElement('mat-icon');
  const name = document.createElement('div');

  const nameInput = document.createElement('input');
  const channelInput = document.createElement('input');

  card.classList.add('card');
  button.type = 'button';
  button.classList.add('main-button');
  button.ariaLabel = chat.name || 'Unknown Chat';
  name.classList.add('name');

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

  card.appendChild(button);
  card.appendChild(editButton);
  card.appendChild(modal);

  modalElements.controls.delete.innerText = 'Delete';

  if (chat.type !== 'system') {
    modalElements.action.appendChild(modalElements.controls.delete);
  }

  nameInput.addEventListener('input', () => {
    chat.name = nameInput.value;
    name.innerText = nameInput.value;
  });
  button.addEventListener('click', () => openChat(chat));
  modalElements.controls.close.addEventListener('click', () => modal.closeModal())
  modalElements.controls.delete.addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete "${chat.name}" chat?`)) {
      modal.closeModal();
      card.remove();
      system.delete(chat.channel);
    }
  });
  editButton.addEventListener('click', () => modal.openModal());

  chatPicker.appendChild(card);
}

function renderInterface() {
  chatPicker.innerHTML = '';

  chats.forEach((chat) => renderChat(chat));
  chatsStack.forEach((chat) => renderChat(chat));
}

elements.chat.add.addEventListener('click', () => {
  if (!elements.customChatModal.hasAttribute('open')) {
    elements.customChatModal.openModal();
  }
})
let customChat;

elements.customChatModal.nameInput.addEventListener(('input'), () => {
  if (elements.customChatModal.nameInput.value.trim() !== '') {
    elements.customChatModal.addButton.disabled = false;
  } else {
    elements.customChatModal.addButton.disabled = true;
  }
  try {
    customChat = new CustomChat(elements.customChatModal.nameInput.value);
    elements.customChatModal.highlight.innerText = `Channel:\n${customChat.channel}`;
    elements.customChatModal.highlight.style.color = '';
    elements.customChatModal.highlight.style.fontFamily = 'var(--font-mono)';
  } catch (error) {
    elements.customChatModal.highlight.innerText = error;
    elements.customChatModal.highlight.style.color = 'var(--error)';
    elements.customChatModal.highlight.style.fontFamily = '';
  }
})
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
});
elements.customChatModal.addEventListener('click', (event) => {
  if (event.target === elements.customChatModal) {
    elements.customChatModal.closeModal();
  }
});
elements.customChatModal.querySelector('button.close-button').addEventListener('click', () => {
  elements.customChatModal.closeModal();
})

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
// })
// chatPicker.addEventListener('focusin', () => {
//   SpatialNavigation.add('chat-picker', {
//     selector: '#chat-picker button'
//   });

//   chatPicker.addEventListener('keydown', (event) => {
//     if (event.key = 'Tab' && !event.shiftKey) {
//       document.querySelector("#app-interface > header > button:nth-child(1)").focus()
//     }
//   }, { once: true })
// });
// chatPicker.addEventListener('focusout', () => {
//   SpatialNavigation.remove('chat-picker');
// });

document.documentElement.setAttribute('data-theme', 'Warm Dark');