// SupabaseのURLとAnonキーを自分のに置き換える
const SUPABASE_URL = "https://nergelpflnjacforslao.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcmdlbHBmbG5qYWNmb3JzbGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODk4OTgsImV4cCI6MjA3NTI2NTg5OH0.NeB2bD5PM6z8RtYRGqlc0QKXmUI1CSHKZtTFYRpIBGE";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// HTML要素
const loginDiv = document.getElementById("login");
const chatDiv = document.getElementById("chat");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const messagesDiv = document.getElementById("messages");

// 初期化
init();

async function init() {
  const { data } = await supabase.auth.getSession();
  if (data.session) showChat();
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      showChat();
    } else {
      showLogin();
    }
  });
}

function showLogin() {
  loginDiv.style.display = "block";
  chatDiv.style.display = "none";
}

function showChat() {
  loginDiv.style.display = "none";
  chatDiv.style.display = "block";
  ensureUserProfile();
  loadMessages();
  subscribeMessages();
}

// ログイン / 新規登録
loginBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return alert("メールとパスワードを入れてね");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error && error.message.includes("Invalid login credentials")) {
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) alert("登録失敗: " + signUpError.message);
    else alert("登録完了！メールを確認してね。");
  } else if (error) {
    alert("エラー: " + error.message);
  }
};

// ログアウト
logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
};

// プロフィールを保存
async function ensureUserProfile() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  await supabase.from("profiles").upsert({
    id: user.id,
    username: user.email,
    avatar_url: null
  });
}

// メッセージ読み込み
async function loadMessages() {
  const { data } = await supabase.from("messages").select("*").order("id", { ascending: true });
  messagesDiv.innerHTML = "";
  data.forEach(addMessage);
}

// メッセージ表示
function addMessage(msg) {
  const div = document.createElement("div");
  div.textContent = `${msg.username}: ${msg.content}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// メッセージ送信
sendBtn.onclick = async () => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return alert("ログインしてね！");

  const content = msgInput.value.trim();
  if (!content) return;

  msgInput.value = "";
  await supabase.from("messages").insert({
    username: user.email,
    content
  });
};

// リアルタイム購読
function subscribeMessages() {
  supabase
    .channel("public:messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
      addMessage(payload.new);
    })
    .subscribe();
}
