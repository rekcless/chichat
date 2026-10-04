
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyDO3bftDtmS5KEzYI-TwL26ApJC6N3f51o",
  authDomain: "chating-78345.firebaseapp.com",
  projectId: "chating-78345",
  storageBucket: "chating-78345.firebasestorage.app",
  messagingSenderId: "123012306699",
  appId: "1:123012306699:web:1661236f2a8f3da0b4340e"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

---

2. "app.js"

import { db, auth } from "./firebase.js";

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


// ======================================================
// ELEMENT
// ======================================================

const authSection = document.getElementById("authSection");

const usernameAuth = document.getElementById("usernameAuth");
const passwordAuth = document.getElementById("passwordAuth");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const friendSection = document.getElementById("friendSection");

const searchUser = document.getElementById("searchUser");
const addFriendBtn = document.getElementById("addFriendBtn");
const friendList = document.getElementById("friendList");

const logoutBtn = document.getElementById("logoutBtn");

const chatSection = document.getElementById("chatSection");
const chatWithName = document.getElementById("chatWithName");
const chatBox = document.getElementById("chatBox");

const chatMessage = document.getElementById("chatMessage");
const sendChatBtn = document.getElementById("sendChatBtn");


// ======================================================
// STATE
// ======================================================

let currentUser = null;
let currentUsername = null;

let currentChatFriend = null;
let currentChatFriendUid = null;

let unsubscribeFriends = null;
let unsubscribeChat = null;


// ======================================================
// USERNAME
// ======================================================

function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}


function usernameToEmail(username) {

  return `${username.toLowerCase()}@chating-78345.firebaseapp.com`;

}


// ======================================================
// SHOW LOGIN
// ======================================================

function showLogin() {

  authSection.style.display = "flex";

  friendSection.style.display = "none";

  chatSection.style.display = "none";

}


// ======================================================
// SHOW APP
// ======================================================

function showApp() {

  authSection.style.display = "none";

  friendSection.style.display = "flex";

}


// ======================================================
// REGISTER
// ======================================================

registerBtn.onclick = async () => {

  const username =
    usernameAuth.value.trim().toLowerCase();

  const password =
    passwordAuth.value;


  if (!username || !password) {

    alert("Username dan password wajib diisi!");

    return;

  }


  if (!isValidUsername(username)) {

    alert(
      "Username harus 3-20 karakter dan hanya boleh menggunakan huruf, angka, atau underscore."
    );

    return;

  }


  if (password.length < 6) {

    alert("Password minimal 6 karakter!");

    return;

  }


  try {

    // ================================================
    // CEK USERNAME
    // ================================================

    const usernameRef =
      doc(db, "usernames", username);

    const usernameSnap =
      await getDoc(usernameRef);


    if (usernameSnap.exists()) {

      alert("Username sudah digunakan!");

      return;

    }


    // ================================================
    // BUAT AKUN AUTH
    // ================================================

    const email =
      usernameToEmail(username);


    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    const user =
      credential.user;


    // ================================================
    // BUAT PROFIL FIRESTORE
    // ================================================

    await setDoc(
      doc(db, "users", user.uid),
      {

        uid: user.uid,

        username: username,

        friends: [],

        createdAt: serverTimestamp()

      }
    );


    // ================================================
    // SIMPAN INDEX USERNAME
    // ================================================

    await setDoc(
      usernameRef,
      {

        uid: user.uid

      }
    );


    alert("Akun berhasil dibuat!");

    usernameAuth.value = "";

    passwordAuth.value = "";

  }

  catch (error) {

    console.error(error);


    if (
      error.code === "auth/email-already-in-use"
    ) {

      alert("Username sudah digunakan!");

    }

    else if (
      error.code === "auth/weak-password"
    ) {

      alert("Password terlalu lemah!");

    }

    else {

      alert(
        "Register gagal: " +
        error.message
      );

    }

  }

};


// ======================================================
// LOGIN
// ======================================================

loginBtn.onclick = async () => {

  const username =
    usernameAuth.value.trim().toLowerCase();

  const password =
    passwordAuth.value;


  if (!username || !password) {

    alert("Username dan password wajib diisi!");

    return;

  }


  if (!isValidUsername(username)) {

    alert("Username tidak valid!");

    return;

  }


  try {

    const email =
      usernameToEmail(username);


    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  }

  catch (error) {

    console.error(error);


    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password"
    ) {

      alert("Username atau password salah!");

    }

    else {

      alert(
        "Login gagal: " +
        error.message
      );

    }

  }

};


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    currentUser = null;

    currentUsername = null;

    currentChatFriend = null;

    currentChatFriendUid = null;


    if (unsubscribeFriends) {

      unsubscribeFriends();

      unsubscribeFriends = null;

    }


    if (unsubscribeChat) {

      unsubscribeChat();

      unsubscribeChat = null;

    }


    showLogin();

    return;

  }


  try {

    currentUser = user.uid;


    const userSnap =
      await getDoc(
        doc(db, "users", user.uid)
      );


    if (!userSnap.exists()) {

      alert(
        "Profil pengguna tidak ditemukan."
      );

      await signOut(auth);

      return;

    }


    currentUsername =
      userSnap.data().username;


    showApp();

    loadFriends();

  }

  catch (error) {

    console.error(error);

    alert("Gagal memuat akun.");

  }

});


// ======================================================
// LOGOUT
// ======================================================

logoutBtn.onclick = async () => {

  try {

    await signOut(auth);

  }

  catch (error) {

    console.error(error);

    alert("Gagal logout.");

  }

};


// ======================================================
// LOAD FRIENDS
// ======================================================

function loadFriends() {

  if (unsubscribeFriends) {

    unsubscribeFriends();

  }


  const userRef =
    doc(db, "users", currentUser);


  unsubscribeFriends =
    onSnapshot(

      userRef,

      (snap) => {

        friendList.innerHTML = "";


        if (!snap.exists()) {

          return;

        }


        const friends =
          snap.data().friends || [];


        if (friends.length === 0) {

          const empty =
            document.createElement("li");

          empty.className = "empty-friend";

          empty.textContent =
            "Belum ada teman.";

          friendList.appendChild(empty);

          return;

        }


        friends.forEach(
          async (friendUsername) => {

            const li =
              document.createElement("li");


            li.className =
              "friend-item";


            li.innerHTML = `
              <div class="friend-avatar">
                👤
              </div>

              <div class="friend-info">
                <strong></strong>
                <span>Teman</span>
              </div>
            `;


            li.querySelector("strong")
              .textContent =
              friendUsername;


            li.onclick = async () => {

              await openChat(
                friendUsername
              );

            };


            friendList.appendChild(li);

          }
        );

      },

      (error) => {

        console.error(error);

        alert(
          "Gagal memuat daftar teman."
        );

      }

    );

}


// ======================================================
// ADD FRIEND
// ======================================================

addFriendBtn.onclick = async () => {

  const friendUsername =
    searchUser.value.trim().toLowerCase();


  if (!friendUsername) {

    alert("Masukkan username teman.");

    return;

  }


  if (
    friendUsername === currentUsername
  ) {

    alert(
      "Kamu tidak bisa menambahkan diri sendiri."
    );

    return;

  }


  if (!isValidUsername(friendUsername)) {

    alert("Username tidak valid.");

    return;

  }


  try {

    // ================================================
    // CARI USERNAME
    // ================================================

    const usernameSnap =
      await getDoc(
        doc(
          db,
          "usernames",
          friendUsername
        )
      );


    if (!usernameSnap.exists()) {

      alert("User tidak ditemukan.");

      return;

    }


    const friendUid =
      usernameSnap.data().uid;


    // ================================================
    // CEK TEMAN SENDIRI
    // ================================================

    const mySnap =
      await getDoc(
        doc(
          db,
          "users",
          currentUser
        )
      );


    const friends =
      mySnap.data().friends || [];


    if (
      friends.includes(friendUsername)
    ) {

      alert("User sudah ada di daftar teman.");

      return;

    }


    // ================================================
    // TAMBAHKAN KE DAFTAR TEMAN SENDIRI
    // ================================================

    await updateDoc(
      doc(
        db,
        "users",
        currentUser
      ),
      {

        friends:
          arrayUnion(friendUsername)

      }
    );


    alert(
      `${friendUsername} berhasil ditambahkan!`
    );


    searchUser.value = "";

  }

  catch (error) {

    console.error(error);

    alert(
      "Gagal menambahkan teman."
    );

  }

};


// ======================================================
// OPEN CHAT
// ======================================================

async function openChat(friendUsername) {

  try {

    const usernameSnap =
      await getDoc(
        doc(
          db,
          "usernames",
          friendUsername
        )
      );


    if (!usernameSnap.exists()) {

      alert(
        "Data teman tidak ditemukan."
      );

      return;

    }


    currentChatFriend =
      friendUsername;


    currentChatFriendUid =
      usernameSnap.data().uid;


    chatWithName.textContent =
      friendUsername;


    chatSection.style.display =
      "flex";


    loadChat();

  }

  catch (error) {

    console.error(error);

    alert(
      "Gagal membuka chat."
    );

  }

}


// ======================================================
// CONVERSATION ID
// ======================================================

function getConversationId() {

  return [

    currentUser,
    currentChatFriendUid

  ]
    .sort()
    .join("_");

}


// ======================================================
// LOAD CHAT REALTIME
// ======================================================

function loadChat() {

  if (unsubscribeChat) {

    unsubscribeChat();

    unsubscribeChat = null;

  }


  chatBox.innerHTML = "";


  if (
    !currentUser ||
    !currentChatFriendUid
  ) {

    return;

  }


  const conversationId =
    getConversationId();


  const conversationRef =
    doc(
      db,
      "conversations",
      conversationId
    );


  // ================================================
  // BUAT DATA CONVERSATION
  // ================================================

  setDoc(
    conversationRef,
    {

      participants: [
        currentUser,
        currentChatFriendUid
      ],

      updatedAt: serverTimestamp()

    },

    {
      merge: true
    }

  ).catch(error => {

    console.error(
      "Gagal membuat conversation:",
      error
    );

  });


  // ================================================
  // MESSAGES
  // ================================================

  const messagesRef =
    collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );


  const messagesQuery =
    query(
      messagesRef,
      orderBy(
        "createdAt",
        "asc"
      )
    );


  unsubscribeChat =
    onSnapshot(

      messagesQuery,

      (snapshot) => {

        chatBox.innerHTML = "";


        snapshot.forEach(
          (messageDoc) => {

            const data =
              messageDoc.data();


            const message =
              document.createElement("div");


            message.className =
              "message " +
              (
                data.senderUid === currentUser
                  ? "self"
                  : "other"
              );


            message.textContent =
              data.text || "";


            chatBox.appendChild(
              message
            );

          }
        );


        requestAnimationFrame(() => {

          chatBox.scrollTop =
            chatBox.scrollHeight;

        });

      },

      (error) => {

        console.error(error);

        chatBox.innerHTML = `
          <div class="chat-error">
            Gagal memuat pesan.
          </div>
        `;

      }

    );

}


// ======================================================
// SEND MESSAGE
// ======================================================

async function sendMessage() {

  const text =
    chatMessage.value.trim();


  if (!text) {

    return;

  }


  if (
    !currentUser ||
    !currentChatFriendUid
  ) {

    alert(
      "Pilih teman terlebih dahulu."
    );

    return;

  }


  if (text.length > 2000) {

    alert(
      "Pesan maksimal 2000 karakter."
    );

    return;

  }


  try {

    sendChatBtn.disabled = true;


    const conversationId =
      getConversationId();


    await addDoc(

      collection(
        db,
        "conversations",
        conversationId,
        "messages"
      ),

      {

        senderUid:
          currentUser,

        text:
          text,

        createdAt:
          serverTimestamp()

      }

    );


    // Update waktu conversation

    await updateDoc(
      doc(
        db,
        "conversations",
        conversationId
      ),
      {

        updatedAt:
          serverTimestamp()

      }
    );


    chatMessage.value = "";

    chatMessage.focus();

  }

  catch (error) {

    console.error(error);

    alert(
      "Pesan gagal dikirim."
    );

  }

  finally {

    sendChatBtn.disabled = false;

  }

}


// ======================================================
// SEND BUTTON
// ======================================================

sendChatBtn.onclick =
  sendMessage;


// ======================================================
// ENTER SEND
// ======================================================

chatMessage.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);

---

3. "index.html"

<!DOCTYPE html>
<html lang="id">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>WapBlog Chat</title>

  <link
    rel="stylesheet"
    href="style.css"
  >

</head>


<body>


  <main class="app">


    <!-- ==========================================
         LOGIN / REGISTER
    =========================================== -->

    <section
      id="authSection"
      class="auth-section"
    >

      <div class="auth-card">


        <div class="logo">

          <div class="logo-icon">
            💬
          </div>

          <h1>
            WapBlog
          </h1>

          <p>
            Chat dengan temanmu
          </p>

        </div>


        <div class="auth-form">


          <div class="input-group">

            <label>
              Username
            </label>

            <input
              id="usernameAuth"
              type="text"
              placeholder="Masukkan username"
              autocomplete="username"
              maxlength="20"
            >

          </div>


          <div class="input-group">

            <label>
              Password
            </label>

            <input
              id="passwordAuth"
              type="password"
              placeholder="Masukkan password"
              autocomplete="current-password"
            >

          </div>


          <div class="auth-buttons">

            <button
              id="loginBtn"
              class="btn btn-primary"
            >
              Masuk
            </button>


            <button
              id="registerBtn"
              class="btn btn-secondary"
            >
              Daftar
            </button>

          </div>


        </div>


      </div>

    </section>



    <!-- ==========================================
         FRIEND SECTION
    =========================================== -->

    <section
      id="friendSection"
      class="friend-section"
      style="display:none;"
    >


      <header class="app-header">


        <div class="brand">

          <div class="brand-icon">
            💬
          </div>


          <div>

            <h2>
              WapBlog Chat
            </h2>

            <span>
              Pesan pribadi
            </span>

          </div>

        </div>


        <button
          id="logoutBtn"
          class="logout-btn"
        >
          Keluar
        </button>


      </header>



      <div class="friend-add">


        <div class="section-title">

          <h3>
            Teman
          </h3>

          <span>
            Tambahkan teman dengan username
          </span>

        </div>


        <div class="search-box">

          <input
            id="searchUser"
            type="text"
            placeholder="Cari username..."
            maxlength="20"
          >


          <button
            id="addFriendBtn"
            class="btn btn-primary"
          >
            + Tambah
          </button>

        </div>


      </div>



      <div class="friend-container">

        <ul
          id="friendList"
          class="friend-list"
        >
        </ul>

      </div>


    </section>



    <!-- ==========================================
         CHAT
    =========================================== -->

    <section
      id="chatSection"
      class="chat-section"
      style="display:none;"
    >


      <header class="chat-header">


        <div class="chat-user">


          <div class="avatar">
            👤
          </div>


          <div>

            <strong
              id="chatWithName"
            >
              Teman
            </strong>

            <span>
              Chat pribadi
            </span>

          </div>


        </div>


      </header>



      <div
        id="chatBox"
        class="chat-box"
      >
      </div>



      <div class="chat-input-area">


        <textarea
          id="chatMessage"
          placeholder="Tulis pesan..."
          maxlength="2000"
          rows="1"
        ></textarea>


        <button
          id="sendChatBtn"
          class="send-btn"
          aria-label="Kirim pesan"
        >
          ➤
        </button>


      </div>


    </section>


  </main>


  <script
    type="module"
    src="app.js"
  ></script>


</body>

</html>

---

4. "style.css"

/* =========================================================
   RESET
========================================================= */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  width: 100%;
  min-height: 100%;
}

body {

  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Arial,
    sans-serif;

  background:
    linear-gradient(
      135deg,
      #f5f7ff,
      #eef2ff
    );

  color: #171a2b;
}


/* =========================================================
   APP
========================================================= */

.app {

  width: 100%;
  min-height: 100vh;

  display: flex;

  justify-content: center;
  align-items: center;

  padding: 24px;
}


/* =========================================================
   LOGIN
========================================================= */

.auth-section {

  width: 100%;
  max-width: 420px;

  display: flex;
  justify-content: center;
}

.auth-card {

  width: 100%;

  padding: 38px 32px;

  border: 1px solid #e9ebf5;

  border-radius: 26px;

  background: rgba(255,255,255,.97);

  box-shadow:
    0 25px 70px rgba(45,50,90,.12);
}


/* =========================================================
   LOGO
========================================================= */

.logo {

  text-align: center;

  margin-bottom: 32px;
}

.logo-icon {

  width: 70px;
  height: 70px;

  display: flex;

  align-items: center;
  justify-content: center;

  margin: 0 auto 16px;

  border-radius: 22px;

  font-size: 32px;

  background:
    linear-gradient(
      135deg,
      #6c63ff,
      #8b5cf6
    );

  box-shadow:
    0 12px 25px rgba(108,99,255,.25);
}

.logo h1 {

  font-size: 28px;

  font-weight: 800;

  letter-spacing: -.7px;
}

.logo p {

  margin-top: 6px;

  font-size: 14px;

  color: #85899c;
}


/* =========================================================
   INPUT
========================================================= */

.input-group {

  margin-bottom: 18px;
}

.input-group label {

  display: block;

  margin-bottom: 8px;

  font-size: 13px;

  font-weight: 700;

  color: #565a6d;
}

.input-group input {

  width: 100%;
  height: 52px;

  padding: 0 16px;

  border: 1px solid #e0e3ee;

  border-radius: 14px;

  outline: none;

  background: #f9faff;

  font-size: 15px;

  color: #171a2b;

  transition: .2s ease;
}

.input-group input:focus {

  border-color: #746cff;

  background: #fff;

  box-shadow:
    0 0 0 4px rgba(116,108,255,.1);
}

.input-group input::placeholder {

  color: #a6a9b8;
}


/* =========================================================
   BUTTON
========================================================= */

.auth-buttons {

  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 12px;

  margin-top: 24px;
}

.btn {

  height: 50px;

  border: none;

  border-radius: 14px;

  cursor: pointer;

  font-size: 14px;

  font-weight: 700;

  transition: .18s ease;
}

.btn:hover {

  transform: translateY(-2px);
}

.btn:active {

  transform: translateY(0);
}

.btn-primary {

  color: #fff;

  background:
    linear-gradient(
      135deg,
      #6c63ff,
      #805cff
    );

  box-shadow:
    0 10px 22px rgba(108,99,255,.22);
}

.btn-secondary {

  color: #62667a;

  background: #f0f1f7;
}

.btn:disabled {

  opacity: .5;

  cursor: not-allowed;

  transform: none;
}


/* =========================================================
   FRIEND SECTION
========================================================= */

.friend-section {

  width: 100%;
  max-width: 560px;

  min-height: 650px;

  display: flex;

  flex-direction: column;

  background: #fff;

  border: 1px solid #e8eaf2;

  border-radius: 26px;

  overflow: hidden;

  box-shadow:
    0 25px 70px rgba(45,50,90,.12);
}


/* =========================================================
   HEADER
========================================================= */

.app-header {

  min-height: 82px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 18px 22px;

  border-bottom: 1px solid #eef0f5;
}

.brand {

  display: flex;

  align-items: center;

  gap: 12px;
}

.brand-icon {

  width: 44px;
  height: 44px;

  display: flex;

  align-items: center;
  justify-content: center;

  border-radius: 14px;

  background: #f0efff;

  font-size: 21px;
}

.brand h2 {

  font-size: 17px;

  font-weight: 800;
}

.brand span {

  display: block;

  margin-top: 3px;

  font-size: 12px;

  color: #9498a9;
}


/* =========================================================
   LOGOUT
========================================================= */

.logout-btn {

  border: none;

  padding: 10px 14px;

  border-radius: 11px;

  background: #fff0f1;

  color: #e24b59;

  font-size: 12px;

  font-weight: 700;

  cursor: pointer;

  transition: .2s ease;
}

.logout-btn:hover {

  background: #ffe1e4;
}


/* =========================================================
   ADD FRIEND
========================================================= */

.friend-add {

  padding: 22px;
}

.section-title {

  margin-bottom: 14px;
}

.section-title h3 {

  font-size: 18px;

  font-weight: 800;
}

.section-title span {

  display: block;

  margin-top: 4px;

  font-size: 12px;

  color: #969aaa;
}

.search-box {

  display: flex;

  gap: 9px;
}

.search-box input {

  flex: 1;

  min-width: 0;

  height: 48px;

  padding: 0 14px;

  border: 1px solid #e1e3ec;

  border-radius: 13px;

  outline: none;

  background: #fafbfe;

  font-size: 14px;
}

.search-box input:focus {

  border-color: #746cff;

  background: #fff;

  box-shadow:
    0 0 0 4px rgba(116,108,255,.08);
}

.search-box .btn {

  height: 48px;

  padding: 0 17px;
}


/* =========================================================
   FRIEND LIST
========================================================= */

.friend-container {

  flex: 1;

  padding: 0 14px 22px;

  overflow-y: auto;
}

.friend-list {

  list-style: none;

  display: flex;

  flex-direction: column;

  gap: 7px;
}

.friend-item {

  display: flex;

  align-items: center;

  gap: 12px;

  padding: 12px 14px;

  border: 1px solid transparent;

  border-radius: 15px;

  background: #f8f9fd;

  cursor: pointer;

  transition: .2s ease;
}

.friend-item:hover {

  background: #f0efff;

  border-color: #dddafe;

  transform: translateX(3px);
}

.friend-avatar {

  width: 40px;
  height: 40px;

  display: flex;

  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  border-radius: 13px;

  background: #ebeaff;

  font-size: 17px;
}

.friend-info strong {

  display: block;

  font-size: 14px;
}

.friend-info span {

  display: block;

  margin-top: 3px;

  font-size: 11px;

  color: #9296a8;
}

.empty-friend {

  padding: 35px 15px;

  text-align: center;

  list-style: none;

  color: #999dad;

  font-size: 13px;
}


/* =========================================================
   CHAT
========================================================= */

.chat-section {

  position: fixed;

  right: 30px;
  bottom: 30px;

  width: 390px;
  height: 620px;

  display: flex;

  flex-direction: column;

  overflow: hidden;

  border: 1px solid #e5e7f0;

  border-radius: 24px;

  background: #fff;

  box-shadow:
    0 25px 70px rgba(31,35,70,.18);

  z-index: 100;
}


/* =========================================================
   CHAT HEADER
========================================================= */

.chat-header {

  height: 72px;

  flex-shrink: 0;

  display: flex;

  align-items: center;

  padding: 0 18px;

  border-bottom: 1px solid #eceef4;
}

.chat-user {

  display: flex;

  align-items: center;

  gap: 11px;
}

.avatar {

  width: 40px;
  height: 40px;

  display: flex;

  align-items: center;
  justify-content: center;

  border-radius: 13px;

  background: #f0efff;

  font-size: 18px;
}

.chat-user strong {

  display: block;

  font-size: 14px;
}

.chat-user span {

  display: block;

  margin-top: 3px;

  font-size: 11px;

  color: #42ad72;
}


/* =========================================================
   CHAT BOX
========================================================= */

.chat-box {

  flex: 1;

  min-height: 0;

  display: flex;

  flex-direction: column;

  gap: 8px;

  padding: 20px 15px;

  overflow-y: auto;

  background:
    linear-gradient(
      180deg,
      #fafbff,
      #f6f7fc
    );
}

.chat-box::-webkit-scrollbar {

  width: 5px;
}

.chat-box::-webkit-scrollbar-thumb {

  background: #d5d7e4;

  border-radius: 10px;
}


/* =========================================================
   MESSAGE
========================================================= */

.message {

  max-width: 78%;

  padding: 10px 13px;

  border-radius: 16px;

  font-size: 13px;

  line-height: 1.5;

  overflow-wrap: anywhere;
}

.message.self {

  align-self: flex-end;

  color: #fff;

  background:
    linear-gradient(
      135deg,
      #6c63ff,
      #805cff
    );

  border-bottom-right-radius: 5px;
}

.message.other {

  align-self: flex-start;

  color: #353848;

  background: #fff;

  border: 1px solid #e8e9f0;

  border-bottom-left-radius: 5px;
}

.chat-error {

  margin: auto;

  color: #999dad;

  font-size: 13px;
}


/* =========================================================
   CHAT INPUT
========================================================= */

.chat-input-area {

  flex-shrink: 0;

  display: flex;

  align-items: flex-end;

  gap: 9px;

  padding: 12px;

  border-top: 1px solid #eceef4;

  background: #fff;
}

.chat-input-area textarea {

  flex: 1;

  resize: none;

  min-height: 44px;
  max-height: 120px;

  padding: 12px 13px;

  border: 1px solid #e0e2eb;

  border-radius: 14px;

  outline: none;

  background: #f8f9fc;

  font-family: inherit;

  font-size: 13px;

  line-height: 1.4;
}

.chat-input-area textarea:focus {

  border-color: #746cff;

  background: #fff;

  box-shadow:
    0 0 0 3px rgba(116,108,255,.08);
}

.send-btn {

  width: 44px;
  height: 44px;

  flex-shrink: 0;

  border: none;

  border-radius: 14px;

  color: #fff;

  background:
    linear-gradient(
      135deg,
      #6c63ff,
      #805cff
    );

  font-size: 18px;

  cursor: pointer;

  transition: .18s ease;
}

.send-btn:hover {

  transform: translateY(-2px);
}

.send-btn:disabled {

  opacity: .5;

  cursor: not-allowed;

  transform: none;
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 700px) {

  .app {

    min-height: 100dvh;

    padding: 12px;

    align-items: flex-start;
  }


  .auth-section {

    margin-top: 35px;
  }


  .auth-card {

    padding: 30px 22px;

    border-radius: 22px;
  }


  .friend-section {

    min-height: calc(100dvh - 24px);

    border-radius: 20px;
  }


  .chat-section {

    inset: 0;

    right: auto;
    bottom: auto;

    width: 100%;
    height: 100dvh;

    border: none;

    border-radius: 0;
  }


  .chat-box {

    padding: 18px 12px;
  }


  .message {

    max-width: 84%;
  }

}


@media (max-width: 380px) {

  .auth-buttons {

    grid-template-columns: 1fr;
  }


  .search-box .btn {

    padding: 0 10px;

    font-size: 12px;
  }

        }
