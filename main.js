const SUPABASE_URL = "<<<ここにProject URL>>>";
const SUPABASE_ANON_KEY = "<<<ここにanon key>>>";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginDiv = document.getElementById("login");
const chatDiv = document.getElementById("chat");
const usernameInput = document.getElementById("username");
const loginBtn = document.getElementById("loginBtn");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const messagesDiv = document.getElementById("messages");

let username = null;

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
