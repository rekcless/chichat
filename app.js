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

console.log("🔥 Chat app loaded");


// =====================================================
// ELEMENT
// =====================================================

const authSection = document.getElementById("authSection");
const friendSection = document.getElementById("friendSection");
const chatSection = document.getElementById("chatSection");

const usernameAuth = document.getElementById("usernameAuth");
const passwordAuth = document.getElementById("passwordAuth");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const searchUser = document.getElementById("searchUser");
const addFriendBtn = document.getElementById("addFriendBtn");
const friendList = document.getElementById("friendList");
const logoutBtn = document.getElementById("logoutBtn");

const chatWithName = document.getElementById("chatWithName");
const chatBox = document.getElementById("chatBox");
const chatMessage = document.getElementById("chatMessage");
const sendChatBtn = document.getElementById("sendChatBtn");


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;
let currentProfile = null;

let selectedFriend = null;

let unsubscribeMessages = null;


// =====================================================
// HELPER
// =====================================================

function cleanUsername(username) {
  return username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}


function usernameToEmail(username) {
  return `${username.toLowerCase().trim()}@chating-78345.firebaseapp.com`;
}


function showError(message) {

  console.error(message);

  let box = document.getElementById("errorBox");

  if (!box) {

    box = document.createElement("div");

    box.id = "errorBox";

    box.style.cssText = `
      position:fixed;
      left:15px;
      right:15px;
      bottom:15px;
      z-index:99999;
      background:#fee2e2;
      color:#991b1b;
      padding:15px;
      border-radius:14px;
      font-size:14px;
      box-shadow:0 10px 30px rgba(0,0,0,.15);
    `;

    document.body.appendChild(box);
  }

  box.textContent = message;
}


function clearError() {

  const box = document.getElementById("errorBox");

  if (box) box.remove();

}


// =====================================================
// DATE FORMAT
// =====================================================

function getDateKey(timestamp) {

  if (!timestamp) {
    return "";
  }

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp);

  return [
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ].join("-");
}


function formatDay(timestamp) {

  if (!timestamp) {
    return "";
  }

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp);

  const now = new Date();

  const todayKey = getDateKey(now);
  const messageKey = getDateKey(date);

  if (messageKey === todayKey) {
    return "Hari ini";
  }

  const yesterday = new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  if (messageKey === getDateKey(yesterday)) {
    return "Kemarin";
  }

  return date.toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );
}


function formatTime(timestamp) {

  if (!timestamp) {
    return "";
  }

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp);

  return date.toLocaleTimeString(
    "id-ID",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


// =====================================================
// REGISTER
// =====================================================

registerBtn?.addEventListener(
  "click",
  async () => {

    clearError();

    const username =
      cleanUsername(usernameAuth.value);

    const password =
      passwordAuth.value;

    if (!username) {
      showError("Username wajib diisi.");
      return;
    }

    if (username.length < 3) {
      showError("Username minimal 3 karakter.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showError(
        "Username hanya boleh huruf, angka, dan underscore."
      );
      return;
    }

    if (!password) {
      showError("Password wajib diisi.");
      return;
    }

    if (password.length < 6) {
      showError(
        "Password minimal 6 karakter."
      );
      return;
    }

    const email =
      usernameToEmail(username);

    registerBtn.disabled = true;
    registerBtn.textContent = "Mendaftar...";

    try {

      const usernameRef =
        doc(db, "usernames", username);

      const usernameSnap =
        await getDoc(usernameRef);

      if (usernameSnap.exists()) {
        throw new Error(
          "Username sudah digunakan."
        );
      }

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const uid =
        credential.user.uid;

      await setDoc(
        doc(db, "users", uid),
        {
          uid: uid,
          username: username,
          friends: [],
          createdAt: serverTimestamp()
        }
      );

      await setDoc(
        doc(db, "usernames", username),
        {
          uid: uid
        }
      );

      alert(
        "Pendaftaran berhasil!"
      );

      usernameAuth.value = "";
      passwordAuth.value = "";

    } catch (error) {

      console.error(error);

      showError(
        "❌ " + error.message
      );

    } finally {

      registerBtn.disabled = false;
      registerBtn.textContent = "Daftar";

    }

  }
);


// =====================================================
// LOGIN
// =====================================================

loginBtn?.addEventListener(
  "click",
  async () => {

    clearError();

    const username =
      cleanUsername(usernameAuth.value);

    const password =
      passwordAuth.value;

    if (!username) {
      showError("Username wajib diisi.");
      return;
    }

    if (!password) {
      showError("Password wajib diisi.");
      return;
    }

    const email =
      usernameToEmail(username);

    loginBtn.disabled = true;
    loginBtn.textContent = "Masuk...";

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    } catch (error) {

      console.error(error);

      let message =
        "Username atau password salah.";

      if (
        error.code ===
        "auth/network-request-failed"
      ) {
        message =
          "Koneksi internet bermasalah.";
      }

      showError("❌ " + message);

    } finally {

      loginBtn.disabled = false;
      loginBtn.textContent = "Masuk";

    }

  }
);


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      currentUser = null;
      currentProfile = null;

      authSection.style.display =
        "flex";

      friendSection.style.display =
        "none";

      chatSection.style.display =
        "none";

      return;
    }

    currentUser = user;

    authSection.style.display =
      "none";

    friendSection.style.display =
      "block";

    chatSection.style.display =
      "none";

    try {

      const profileSnap =
        await getDoc(
          doc(db, "users", user.uid)
        );

      if (!profileSnap.exists()) {
        showError(
          "Profile user tidak ditemukan."
        );
        return;
      }

      currentProfile =
        profileSnap.data();

      loadFriends();

    } catch (error) {

      console.error(error);

      showError(
        "Gagal memuat profile."
      );

    }

  }
);


// =====================================================
// LOAD FRIENDS
// =====================================================

async function loadFriends() {

  friendList.innerHTML = "";

  const friends =
    currentProfile?.friends || [];

  if (friends.length === 0) {

    friendList.innerHTML = `
      <li class="empty-friends">
        Belum ada teman.
      </li>
    `;

    return;
  }

  for (const uid of friends) {

    try {

      const snap =
        await getDoc(
          doc(db, "users", uid)
        );

      if (!snap.exists()) continue;

      const friend =
        snap.data();

      const li =
        document.createElement("li");

      li.innerHTML = `
        <button class="friend-item">

          <span class="friend-avatar">
            ${friend.username
              .charAt(0)
              .toUpperCase()}
          </span>

          <span class="friend-info">
            <strong>
              ${friend.username}
            </strong>

            <small>
              Klik untuk membuka chat
            </small>
          </span>

          <span class="friend-arrow">
            ›
          </span>

        </button>
      `;

      li.querySelector(
        ".friend-item"
      ).addEventListener(
        "click",
        () => {

          openChat({
            uid: uid,
            username: friend.username
          });

        }
      );

      friendList.appendChild(li);

    } catch (error) {

      console.error(error);

    }

  }

}


// =====================================================
// ADD FRIEND
// =====================================================

addFriendBtn?.addEventListener(
  "click",
  async () => {

    clearError();

    const username =
      cleanUsername(searchUser.value);

    if (!username) {
      showError(
        "Masukkan username teman."
      );
      return;
    }

    if (
      username ===
      currentProfile.username
    ) {
      showError(
        "Kamu tidak bisa menambahkan diri sendiri."
      );
      return;
    }

    try {

      const usernameSnap =
        await getDoc(
          doc(db, "usernames", username)
        );

      if (!usernameSnap.exists()) {

        showError(
          "Username tidak ditemukan."
        );

        return;
      }

      const friendUid =
        usernameSnap.data().uid;

      await updateDoc(
        doc(db, "users", currentUser.uid),
        {
          friends:
            arrayUnion(friendUid)
        }
      );

      await updateDoc(
        doc(db, "users", friendUid),
        {
          friends:
            arrayUnion(currentUser.uid)
        }
      );

      currentProfile.friends =
        Array.from(
          new Set([
            ...(currentProfile.friends || []),
            friendUid
          ])
        );

      searchUser.value = "";

      alert(
        "Teman berhasil ditambahkan!"
      );

      loadFriends();

    } catch (error) {

      console.error(error);

      showError(
        "Gagal menambahkan teman."
      );

    }

  }
);


// =====================================================
// CONVERSATION ID
// =====================================================

function conversationId(
  uid1,
  uid2
) {

  return [
    uid1,
    uid2
  ]
    .sort()
    .join("_");

}


// =====================================================
// OPEN CHAT
// =====================================================

async function openChat(friend) {

  selectedFriend = friend;

  chatSection.style.display =
    "block";

  chatWithName.textContent =
    friend.username;

  chatBox.innerHTML = `
    <div class="chat-loading">
      Memuat pesan...
    </div>
  `;

  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  const convId =
    conversationId(
      currentUser.uid,
      friend.uid
    );

  const conversationRef =
    doc(
      db,
      "conversations",
      convId
    );

  try {

    const snap =
      await getDoc(
        conversationRef
      );

    if (!snap.exists()) {

      await setDoc(
        conversationRef,
        {
          participants: [
            currentUser.uid,
            friend.uid
          ],
          updatedAt:
            serverTimestamp()
        }
      );

    }

    const messagesRef =
      collection(
        db,
        "conversations",
        convId,
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

    unsubscribeMessages =
      onSnapshot(
        messagesQuery,
        async (snapshot) => {

          chatBox.innerHTML = "";

          let previousDate = "";

          const unreadMessages = [];

          snapshot.forEach(
            (messageDoc) => {

              const message =
                messageDoc.data();

              const messageDate =
                message.createdAt;

              const dateKey =
                getDateKey(
                  messageDate
                );

              // =========================
              // DATE SEPARATOR
              // =========================

              if (
                dateKey !==
                previousDate
              ) {

                const dateDivider =
                  document.createElement(
                    "div"
                  );

                dateDivider.className =
                  "date-divider";

                dateDivider.innerHTML = `
                  <span>
                    ${formatDay(
                      messageDate
                    )}
                  </span>
                `;

                chatBox.appendChild(
                  dateDivider
                );

                previousDate =
                  dateKey;
              }


              // =========================
              // MESSAGE
              // =========================

              const isMine =
                message.senderUid ===
                currentUser.uid;

              const messageWrapper =
                document.createElement(
                  "div"
                );

              messageWrapper.className =
                isMine
                  ? "message-row mine"
                  : "message-row theirs";


              const bubble =
                document.createElement(
                  "div"
                );

              bubble.className =
                "message-bubble";


              const text =
                document.createElement(
                  "div"
                );

              text.className =
                "message-text";

              text.textContent =
                message.text;


              const meta =
                document.createElement(
                  "div"
                );

              meta.className =
                "message-meta";


              const time =
                document.createElement(
                  "span"
                );

              time.className =
                "message-time";

              time.textContent =
                formatTime(
                  message.createdAt
                );


              meta.appendChild(
                time
              );


              // =========================
              // READ RECEIPT
              // =========================

              if (isMine) {

                const status =
                  document.createElement(
                    "span"
                  );

                status.className =
                  "message-status";

                if (message.readAt) {

                  status.textContent =
                    "✓✓";

                  status.classList.add(
                    "read"
                  );

                  status.title =
                    "Sudah dibaca";

                } else {

                  status.textContent =
                    "✓";

                  status.title =
                    "Terkirim";

                }

                meta.appendChild(
                  status
                );

              }


              bubble.appendChild(
                text
              );

              bubble.appendChild(
                meta
              );

              messageWrapper.appendChild(
                bubble
              );

              chatBox.appendChild(
                messageWrapper
              );


              // =========================
              // UNREAD MESSAGE
              // =========================

              if (
                !isMine &&
                !message.readAt
              ) {

                unreadMessages.push(
                  messageDoc.id
                );

              }

            }
          );


          // =========================
          // MARK AS READ
          // =========================

          if (
            unreadMessages.length > 0
          ) {

            for (
              const messageId
              of unreadMessages
            ) {

              try {

                await updateDoc(
                  doc(
                    db,
                    "conversations",
                    convId,
                    "messages",
                    messageId
                  ),
                  {
                    readAt:
                      serverTimestamp()
                  }
                );

              } catch (error) {

                console.error(
                  "Read receipt error:",
                  error
                );

              }

            }

          }


          // =========================
          // SCROLL
          // =========================

          requestAnimationFrame(
            () => {

              chatBox.scrollTop =
                chatBox.scrollHeight;

            }
          );

        },
        (error) => {

          console.error(
            "CHAT ERROR:",
            error
          );

          showError(
            "Gagal memuat chat: " +
            error.message
          );

        }
      );

  } catch (error) {

    console.error(error);

    showError(
      "Gagal membuka chat."
    );

  }

}


// =====================================================
// SEND MESSAGE
// =====================================================

sendChatBtn?.addEventListener(
  "click",
  async () => {

    const text =
      chatMessage.value.trim();

    if (!text) return;

    if (!selectedFriend) {
      showError(
        "Pilih teman terlebih dahulu."
      );
      return;
    }

    if (text.length > 2000) {
      showError(
        "Pesan maksimal 2000 karakter."
      );
      return;
    }

    const convId =
      conversationId(
        currentUser.uid,
        selectedFriend.uid
      );

    try {

      await addDoc(
        collection(
          db,
          "conversations",
          convId,
          "messages"
        ),
        {
          senderUid:
            currentUser.uid,

          text: text,

          createdAt:
            serverTimestamp(),

          readAt: null
        }
      );

      await updateDoc(
        doc(
          db,
          "conversations",
          convId
        ),
        {
          updatedAt:
            serverTimestamp()
        }
      );

      chatMessage.value = "";

      chatMessage.focus();

    } catch (error) {

      console.error(error);

      showError(
        "Gagal mengirim pesan: " +
        error.message
      );

    }

  }
);


// =====================================================
// ENTER SEND
// =====================================================

chatMessage?.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendChatBtn.click();

    }

  }
);


// =====================================================
// LOGOUT
// =====================================================

logoutBtn?.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

    } catch (error) {

      console.error(error);

      showError(
        "Gagal keluar dari akun."
      );

    }

  }
);
