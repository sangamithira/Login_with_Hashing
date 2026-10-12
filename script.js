const STORAGE_KEY = 'secure_login_users';
const DEMO_USERNAME = 'admin';
const DEMO_PASSWORD = 'admin123';

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const messageBox = document.getElementById('message');
const demoUserButton = document.getElementById('demo-user-btn');

function showMessage(text, type = 'info') {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
}

function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password, salt) {
  return sha256(`${salt}:${password}`);
}

function getUsers() {
  const rawUsers = localStorage.getItem(STORAGE_KEY);
  return rawUsers ? JSON.parse(rawUsers) : {};
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

async function createUser(username, password) {
  const users = getUsers();
  const salt = generateSalt();
  const hashedPassword = await hashPassword(password, salt);

  users[username] = {
    username,
    salt,
    passwordHash: hashedPassword,
  };

  saveUsers(users);
}

async function verifyUser(username, password) {
  const users = getUsers();
  const user = users[username];

  if (!user) {
    return false;
  }

  const computedHash = await hashPassword(password, user.salt);
  return computedHash === user.passwordHash;
}

async function ensureDemoUser() {
  const users = getUsers();
  if (!users[DEMO_USERNAME]) {
    await createUser(DEMO_USERNAME, DEMO_PASSWORD);
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showMessage('Please enter both username and password.', 'error');
    return;
  }

  const isValid = await verifyUser(username, password);

  if (isValid) {
    showMessage(`Login successful! Welcome back, ${username}.`, 'success');
    loginForm.reset();
  } else {
    showMessage('Invalid username or password.', 'error');
  }
});

demoUserButton.addEventListener('click', async () => {
  await ensureDemoUser();
  usernameInput.value = DEMO_USERNAME;
  passwordInput.value = DEMO_PASSWORD;
  showMessage('Demo account loaded. Username: admin, Password: admin123', 'info');
});

(async () => {
  await ensureDemoUser();
  showMessage('Demo account ready. Use admin / admin123 to test login.', 'info');
})();
