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
    card = document.createElement('button');
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
    const deleteButton = document.createElement('button');
    card.classList.add('editing');
    deleteButton.innerText = 'delete';
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