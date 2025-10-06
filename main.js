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
