// Elements
const chatContainer = document.querySelector('#chat-container');
const chatPicker = document.querySelector('#chat-picker');
const customChatName = document.querySelector('#custom-chat-name');
const customChatChannel = document.querySelector('#custom-chat-channel');
const addCustomChatButtonModal = document.querySelector('#add-custom-chat-button-modal');
const addCustomChatModal = document.querySelector('#add-custom-chat-modal');
const addCustomChatButton = document.querySelector('#add-custom-chat-button');

// Events

const system = {
  mode: 'normal',
  setMode: (mode) => {
    system.mode = mode;
    body.setAttribute('data-mode', mode);

    updateChatInterface();
  }
}

// The array of global chats to be available by default
const chats = [
  {
    type: 'system',
    name: 'Home',
    channel: 'home'
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
let customChats = [];

let savedCustomChats = JSON.parse(localStorage.getItem('saved-custom-chats'));

if (savedCustomChats) {
  customChats = savedCustomChats;
}
customChatChannel.addEventListener('input', () => {
  const input = customChatChannel;
  const caretPosition = input.selectionStart;
  input.value = slugify(input.value);
  input.setSelectionRange(caretPosition, caretPosition);
});






function slugify(source) {
  return source.toLowerCase().replace(/[^a-z0-9]/g, '-');
}
function openChat(item) {
  if (window.location.href.includes('perchance.org/custom-chat')) {
    if (item.type == 'custom') {
      customChat.channel = `${item.channel}-${item.token}`;
      customChat.channelLabel = item.name;
      update();
    } else {
      customChat.channel = item.channel;
      customChat.channelLabel = item.name;
      update();
    }
  } else {
    console.log(`\n\n$ Open chat\nName: ${item.name}\nChannel: ${item.channel}\n\n`)
  }
}
function removeChat(card, item) {
  const index = customChats.indexOf(item);

  if (index !== -1) {
    customChats.splice(index, 1);
    card.remove();
    localStorage.setItem('saved-custom-chats', JSON.stringify(customChats));
  }
}
function createChat(item) {
  const card = document.createElement('div');
  const buttonContainer = document.createElement('div'); // I NEED CONTAINERS JUST TO MANAGE MY OTHER CONTAINER BECAUSE ELEMENT.HIDDEN = TRUE WON'T WORK
  const button = document.createElement('button');
  const editButton = document.createElement('button');
  const icon = document.createElement('mat-icon');
  const editIcon = document.createElement('mat-icon');
  const name = document.createElement('div');
  const channel = document.createElement('div');

  const nameInput = document.createElement('input');
  const channelInput = document.createElement('input');

  const modal = document.createElement('dialog', { is: 'c-modal' });

  card.classList.add('card');
  buttonContainer.classList.add('main-button-container');
  button.classList.add('main-button');
  button.ariaLabel = 'Open chat ' + item.name;
  name.classList.add('name');
  channel.classList.add('channel');
  editButton.classList.add('edit-button');
  editButton.classList.add('icon-button');
  editButton.ariaLabel = 'Edit';

  name.innerText = item.name;
  icon.classList.add('card-icon');
  icon.innerText = 'forum';
  editIcon.innerText = 'tune';

  nameInput.name = 'chat-name'
  nameInput.placeholder = 'Chat name'
  nameInput.value = item.name;

  channel.innerText = '#' + item.channel;

  channelInput.name = 'chat-channel'
  channelInput.placeholder = 'Chat channel'
  channelInput.value = item.channel;

  buttonContainer.appendChild(button);
  button.appendChild(icon);
  button.appendChild(name);
  button.appendChild(channel);
  editButton.appendChild(editIcon);

  card.appendChild(buttonContainer);
  card.appendChild(editButton);
  card.appendChild(modal);

  modal.appendChild(nameInput);
  modal.appendChild(channelInput);

  const deleteButton = document.createElement('button');
  deleteButton.innerText = 'Delete';

  nameInput.addEventListener('input', () => {
    item.name = nameInput.value;
    name.innerText = nameInput.value;
    localStorage.setItem('saved-custom-chats', JSON.stringify(customChats));
  });
  channelInput.addEventListener('input', () => {
    channel.innerText = channelInput.value;

    const caretPosition = channelInput.selectionStart;
    item.channel = slugify(channelInput.value);
    channelInput.value = slugify(channelInput.value);
    channelInput.setSelectionRange(caretPosition, caretPosition);
    localStorage.setItem('saved-custom-chats', JSON.stringify(customChats));
  });
  button.addEventListener('click', () => openChat(item));
  deleteButton.addEventListener('click', () => removeChat(card, item));
  editButton.addEventListener('click', () => modal.openModal());

  chatPicker.appendChild(card);
}

function updateChatInterface() {
  chatPicker.innerHTML = '';

  if (system.mode !== 'editing') {
    chats.forEach((item) => createChat(item));
  }
  customChats.forEach((item) => createChat(item));
}

updateChatInterface();

let __customChannelInternalCheck__;
if (customChatChannel.value == '') {
  __customChannelInternalCheck__ = true;
}
customChatChannel.addEventListener("input", () => {
  __customChannelInternalCheck__ = false
  if (customChatChannel.value == '') __customChannelInternalCheck__ = true;
});


customChatName.oninput = () => {
  if (__customChannelInternalCheck__) {
    customChatChannel.value = slugify(customChatName.value.trim());
  }
}

addCustomChatButtonModal.addEventListener('click', () => {
  if (!addCustomChatModal.hasAttribute('open')) {
    addCustomChatModal.openModal();
  }
})

addCustomChatModal.addEventListener('click', (event) => {
  if (event.target === addCustomChatModal) {
    addCustomChatModal.closeModal();
  }
});

addCustomChatModal.querySelector('button.close-button').addEventListener('click', () => {
  addCustomChatModal.closeModal();
})

addCustomChatButton.addEventListener('click', () => {

  const customChatObject = {
    version: 1,
    /* This is the type. I defined a type to distinguish
     this from the system chats that are predefined. */
    type: 'custom',
    /* This is the name of the channel, it serves no
    purpose other than customizeability. */
    name: customChatName.value || customChatChannel.value,
    // This is the channel name, this should be self-explanatory.
    channel: customChatChannel.value,
    /* This is the token, and this is the real thing that
    distinguishes one chat from another.
    A token is a randomly generated unique ID, the reason
    I had to use this is because every chat is public, and
    the unique ID makes sure no one can just randomly
    access a private chat. */
    token: crypto.randomUUID(),
    // The rest are for sorting and organizing
    timestamp: new Date().getTime(),
    modified: null,
    records: []
  }

  customChats.push(customChatObject);
  localStorage.setItem('saved-custom-chats', JSON.stringify(customChats));

  addCustomChatModal.closeModal();
  createChat(customChatObject);
});

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