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
