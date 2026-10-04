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

console.log("✅ app.js berhasil dimuat");

// ===============================
// ELEMENT
// ===============================

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


// ===============================
// CEK ELEMENT
// ===============================

console.log({
  loginBtn,
  registerBtn,
  usernameAuth,
  passwordAuth
});

if (!loginBtn || !registerBtn) {
  alert("❌ Tombol login/daftar tidak ditemukan. Cek ID di index.html.");
}


// ===============================
// STATUS
// ===============================

let currentUser = null;
let currentProfile = null;
let selectedFriend = null;
let unsubscribeMessages = null;


// ===============================
// HELPER
// ===============================

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
      border-radius:12px;
      font-size:14px;
      box-shadow:0 10px 30px rgba(0,0,0,.15);
      border:1px solid #fecaca;
    `;

    document.body.appendChild(box);
  }

  box.textContent = message;
}


function clearError() {
  const box = document.getElementById("errorBox");
  if (box) box.remove();
}


function usernameToEmail(username) {
  return `${username.toLowerCase().trim()}@chating-78345.firebaseapp.com`;
}


function cleanUsername(username) {
  return username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}


// ===============================
// REGISTER
// ===============================

registerBtn?.addEventListener("click", async () => {

  console.log("🟢 Tombol DAFTAR ditekan");

  clearError();

  const username = cleanUsername(usernameAuth.value);
  const password = passwordAuth.value;

  if (!username) {
    showError("Username wajib diisi.");
    return;
  }

  if (username.length < 3) {
    showError("Username minimal 3 karakter.");
    return;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showError("Username hanya boleh huruf, angka, dan underscore.");
    return;
  }

  if (!password) {
    showError("Password wajib diisi.");
    return;
  }

  if (password.length < 6) {
    showError("Password minimal 6 karakter.");
    return;
  }

  const email = usernameToEmail(username);

  registerBtn.disabled = true;
  registerBtn.textContent = "Mendaftar...";

  try {

    console.log("Membuat akun:", email);

    // Cek username
    const usernameRef = doc(db, "usernames", username);
    const usernameSnap = await getDoc(usernameRef);

    if (usernameSnap.exists()) {
      throw new Error("Username sudah digunakan.");
    }

    // Buat akun Firebase Authentication
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = credential.user.uid;

    console.log("✅ Auth berhasil:", uid);

    // Simpan profile
    await setDoc(doc(db, "users", uid), {
      uid: uid,
      username: username,
      friends: [],
      createdAt: serverTimestamp()
    });

    // Simpan username mapping
    await setDoc(doc(db, "usernames", username), {
      uid: uid
    });

    alert("✅ Pendaftaran berhasil!");

    usernameAuth.value = "";
    passwordAuth.value = "";

  } catch (error) {

    console.error("REGISTER ERROR:", error);

    let message = error.message;

    switch (error.code) {

      case "auth/email-already-in-use":
        message = "Username tersebut sudah terdaftar.";
        break;

      case "auth/weak-password":
        message = "Password terlalu lemah. Minimal 6 karakter.";
        break;

      case "auth/invalid-email":
        message = "Format username tidak valid.";
        break;

      case "permission-denied":
        message = "Firestore menolak akses. Cek Firestore Rules.";
        break;

      case "failed-precondition":
        message = "Firebase belum dikonfigurasi dengan benar.";
        break;
    }

    showError("❌ " + message);

  } finally {

    registerBtn.disabled = false;
    registerBtn.textContent = "Daftar";

  }

});


// ===============================
// LOGIN
// ===============================

loginBtn?.addEventListener("click", async () => {

  console.log("🟢 Tombol MASUK ditekan");

  clearError();

  const username = cleanUsername(usernameAuth.value);
  const password = passwordAuth.value;

  if (!username) {
    showError("Username wajib diisi.");
    return;
  }

  if (!password) {
    showError("Password wajib diisi.");
    return;
  }

  const email = usernameToEmail(username);

  loginBtn.disabled = true;
  loginBtn.textContent = "Masuk...";

  try {

    console.log("Login:", email);

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("✅ Login berhasil");

    usernameAuth.value = "";
    passwordAuth.value = "";

  } catch (error) {

    console.error("LOGIN ERROR:", error);

    let message = error.message;

    switch (error.code) {

      case "auth/invalid-credential":
        message = "Username atau password salah.";
        break;

      case "auth/user-not-found":
        message = "Username belum terdaftar.";
        break;

      case "auth/wrong-password":
        message = "Password salah.";
        break;

      case "auth/too-many-requests":
        message = "Terlalu banyak percobaan. Coba lagi nanti.";
        break;

      case "auth/network-request-failed":
        message = "Tidak ada koneksi internet.";
        break;
    }

    showError("❌ " + message);

  } finally {

    loginBtn.disabled = false;
    loginBtn.textContent = "Masuk";

  }

});


// ===============================
// AUTH STATE
// ===============================

onAuthStateChanged(auth, async (user) => {

  console.log("AUTH STATE:", user);

  if (user) {

    currentUser = user;

    console.log("✅ User login:", user.uid);

    authSection.style.display = "none";
    friendSection.style.display = "block";
    chatSection.style.display = "none";

    try {

      const profileRef = doc(db, "users", user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        showError("Profile user tidak ditemukan.");
        return;
      }

      currentProfile = profileSnap.data();

      console.log("PROFILE:", currentProfile);

      loadFriends();

    } catch (error) {

      console.error(error);
      showError("Gagal mengambil data user dari Firestore.");

    }

  } else {

    currentUser = null;
    currentProfile = null;

    authSection.style.display = "block";
    friendSection.style.display = "none";
    chatSection.style.display = "none";

  }

});


// ===============================
// LOAD FRIENDS
// ===============================

async function loadFriends() {

  friendList.innerHTML = "";

  const friends = currentProfile?.friends || [];

  if (friends.length === 0) {

    friendList.innerHTML = `
      <li style="padding:15px;color:#777;">
        Belum ada teman.
      </li>
    `;

    return;
  }

  for (const uid of friends) {

    try {

      const snap = await getDoc(doc(db, "users", uid));

      if (!snap.exists()) continue;

      const friend = snap.data();

      const li = document.createElement("li");

      li.innerHTML = `
        <button class="friend-item">
          ${friend.username}
        </button>
      `;

      li.querySelector("button").addEventListener("click", () => {

        openChat({
          uid: uid,
          username: friend.username
        });

      });

      friendList.appendChild(li);

    } catch (error) {

      console.error(error);

    }

  }

}


// ===============================
// ADD FRIEND
// ===============================

addFriendBtn?.addEventListener("click", async () => {

  clearError();

  const username = cleanUsername(searchUser.value);

  if (!username) {
    showError("Masukkan username teman.");
    return;
  }

  if (username === currentProfile.username) {
    showError("Kamu tidak bisa menambahkan diri sendiri.");
    return;
  }

  try {

    const usernameSnap = await getDoc(
      doc(db, "usernames", username)
    );

    if (!usernameSnap.exists()) {
      showError("Username tidak ditemukan.");
      return;
    }

    const friendUid = usernameSnap.data().uid;

    const friendRef = doc(db, "users", friendUid);
    const friendSnap = await getDoc(friendRef);

    if (!friendSnap.exists()) {
      showError("Data user tidak ditemukan.");
      return;
    }

    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        friends: arrayUnion(friendUid)
      }
    );

    await updateDoc(
      doc(db, "users", friendUid),
      {
        friends: arrayUnion(currentUser.uid)
      }
    );

    currentProfile.friends = [
      ...(currentProfile.friends || []),
      friendUid
    ];

    searchUser.value = "";

    alert("✅ Teman berhasil ditambahkan!");

    loadFriends();

  } catch (error) {

    console.error("ADD FRIEND ERROR:", error);

    showError(
      "❌ Gagal menambahkan teman: " +
      error.message
    );

  }

});


// ===============================
// CHAT
// ===============================

function conversationId(uid1, uid2) {

  return [uid1, uid2]
    .sort()
    .join("_");

}


async function openChat(friend) {

  selectedFriend = friend;

  chatSection.style.display = "block";

  chatWithName.textContent = friend.username;

  chatBox.innerHTML = `
    <div style="text-align:center;color:#777;padding:20px;">
      Memuat chat...
    </div>
  `;

  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  const convId = conversationId(
    currentUser.uid,
    friend.uid
  );

  const conversationRef = doc(
    db,
    "conversations",
    convId
  );

  try {

    const snap = await getDoc(conversationRef);

    if (!snap.exists()) {

      await setDoc(conversationRef, {
        participants: [
          currentUser.uid,
          friend.uid
        ],
        updatedAt: serverTimestamp()
      });

    }

    const messagesRef = collection(
      db,
      "conversations",
      convId,
      "messages"
    );

    const messagesQuery = query(
      messagesRef,
      orderBy("createdAt", "asc")
    );

    unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {

        chatBox.innerHTML = "";

        snapshot.forEach((docSnap) => {

          const message = docSnap.data();

          const div = document.createElement("div");

          div.style.cssText = `
            padding:10px 14px;
            margin:6px 0;
            border-radius:12px;
            max-width:75%;
            word-break:break-word;
            ${
              message.senderUid === currentUser.uid
              ? "margin-left:auto;background:#6c5ce7;color:white;"
              : "margin-right:auto;background:#eee;color:#222;"
            }
          `;

          div.textContent = message.text;

          chatBox.appendChild(div);

        });

        chatBox.scrollTop = chatBox.scrollHeight;

      },
      (error) => {

        console.error("CHAT ERROR:", error);

        showError(
          "❌ Gagal memuat chat: " +
          error.message
        );

      }
    );

  } catch (error) {

    console.error(error);

    showError(
      "❌ Gagal membuka percakapan: " +
      error.message
    );

  }

}


// ===============================
// SEND MESSAGE
// ===============================

sendChatBtn?.addEventListener("click", async () => {

  const text = chatMessage.value.trim();

  if (!text) return;

  if (!selectedFriend) {
    showError("Pilih teman terlebih dahulu.");
    return;
  }

  if (text.length > 2000) {
    showError("Pesan maksimal 2000 karakter.");
    return;
  }

  const convId = conversationId(
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
        senderUid: currentUser.uid,
        text: text,
        createdAt: serverTimestamp()
      }
    );

    await updateDoc(
      doc(db, "conversations", convId),
      {
        updatedAt: serverTimestamp()
      }
    );

    chatMessage.value = "";

  } catch (error) {

    console.error("SEND MESSAGE ERROR:", error);

    showError(
      "❌ Gagal mengirim pesan: " +
      error.message
    );

  }

});


// ===============================
// ENTER UNTUK KIRIM
// ===============================

chatMessage?.addEventListener("keydown", (event) => {

  if (event.key === "Enter" && !event.shiftKey) {

    event.preventDefault();

    sendChatBtn.click();

  }

});


// ===============================
// LOGOUT
// ===============================

logoutBtn?.addEventListener("click", async () => {

  try {

    await signOut(auth);

    console.log("✅ Logout berhasil");

  } catch (error) {

    console.error(error);

    showError(
      "❌ Gagal logout: " +
      error.message
    );

  }

});
