const SUPABASE_URL = "https://nergelpflnjacforslao.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcmdlbHBmbG5qYWNmb3JzbGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODk4OTgsImV4cCI6MjA3NTI2NTg5OH0.NeB2bD5PM6z8RtYRGqlc0QKXmUI1CSHKZtTFYRpIBGE";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginDiv = document.getElementById("login");
const chatDiv = document.getElementById("chat");
const usernameInput = document.getElementById("username");
const loginBtn = document.getElementById("loginBtn");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const messagesDiv = document.getElementById("messages");

let username = null;

// ログインしたらユーザー情報を profiles に保存（初回だけ）
async function ensureUserProfile() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  // すでに存在するかチェック
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!existing) {
    // なければ作成
    await supabase.from("profiles").insert({
      id: user.id,
      username: user.email,
      avatar_url: null,
    });
  }
}

loginBtn.onclick = async () => {
  username = usernameInput.value.trim();
  if (!username) return alert("名前入れろや！");
  loginDiv.style.display = "none";
  chatDiv.style.display = "block";
  loadMessages();
  subscribeMessages();
};

async function loadMessages() {
  const { data } = await client.from("messages").select("*").order("id", { ascending: true });
  messagesDiv.innerHTML = "";
  data.forEach(addMessage);
}

function addMessage(msg) {
  const div = document.createElement("div");
  div.textContent = `${msg.username}: ${msg.content}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

sendBtn.onclick = async () => {
  const content = msgInput.value.trim();
  if (!content) return;
  msgInput.value = "";
  await client.from("messages").insert({ username, content });
};

// リアルタイム購読
function subscribeMessages() {
  client
    .channel("public:messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
      addMessage(payload.new);
    })
    .subscribe();
}

// supabase 初期化は既存と同じ
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let session = null;  // ユーザーセッション情報

async function initAuthState() {
  const { data } = await supabase.auth.getSession();
  session = data.session;

  supabase.auth.onAuthStateChange((_event, newSession) => {
    session = newSession;
    handleAuthChange();
  });
}

function handleAuthChange() {
  if (session && session.user) {
    // ログイン済み
    loginDiv.style.display = "none";
    chatDiv.style.display = "block";
    startChat();
  } else {
    // ログアウト or 未ログイン
    loginDiv.style.display = "block";
    chatDiv.style.display = "none";
  }
}

// ログイン（例：メール＆パスワード）
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) {
    console.error("ログイン失敗：", error.message);
    alert("ログインできんかった");
  }
  // handleAuthChange が呼ばれる
}

// ログアウト
async function signOut() {
  await supabase.auth.signOut();
  // handleAuthChange により画面が戻る
}

