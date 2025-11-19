import streamlit as st
import requests
import base64

# Load and encode logo
logo_path = r"C:\Users\palak\OneDrive\Desktop\coding assistant\logo.jpg"
with open(logo_path, "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read()).decode()

# Modern custom CSS for enhanced UI
st.markdown("""
<style>
body, .stApp {
    background: linear-gradient(135deg, #181c24 0%, #232b3a 100%) !important;
    color: #f3f6fa !important;
    font-family: 'Segoe UI', 'Roboto', sans-serif;
}
.header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 18px 10px 10px 10px;
    background: #232b3a;
    border-radius: 18px;
    box-shadow: 0 2px 12px rgba(20, 30, 50, 0.25);
    margin-bottom: 18px;
}
.header img {
    max-width: 90px;
    margin: 10px 18px 10px 10px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(20, 30, 50, 0.20);
}
.header h1 {
    font-size: 2.3em;
    margin: 10px;
    color: #6ec1e4;
    font-weight: 800;
    letter-spacing: 1px;
}
.stButton > button {
    background: linear-gradient(90deg, #6ec1e4 0%, #4caf50 100%);
    color: #181c24;
    border: none;
    border-radius: 8px;
    padding: 0.6em 1.5em;
    font-size: 1.1em;
    font-weight: 600;
    margin: 0.5em 0;
    box-shadow: 0 2px 8px rgba(20, 30, 50, 0.20);
    transition: background 0.3s;
}
.stButton > button:hover {
    background: linear-gradient(90deg, #4caf50 0%, #6ec1e4 100%);
    color: #fff;
}
.card {
    background: #232b3a;
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(20, 30, 50, 0.25);
    padding: 1.5em 1.2em;
    margin: 1.2em 0;
    color: #f3f6fa;
}
.stSelectbox, .stTextInput, .stTextArea {
    border-radius: 8px !important;
    background: #232b3a !important;
    color: #f3f6fa !important;
}
.stSidebar {
    background: #181c24 !important;
    color: #f3f6fa !important;
}
.stSidebar .sidebar-content {
    padding-top: 2em;
    color: #f3f6fa !important;
}
.stSidebar .sidebar-content h1, .stSidebar .sidebar-content h2 {
    color: #6ec1e4;
}
.stSidebar .sidebar-content {
    font-size: 1.1em;
}
@media(max-width: 768px){
    .header { flex-direction: column; align-items: center; }
}
</style>
""", unsafe_allow_html=True)

# Header with logo and title
st.markdown(f"""
<div class="header">
    <img src='data:image/jpeg;base64,{encoded_string}' />
    <h1>KodesCRUxxx</h1>
</div>
<p style='text-align:center; font-size:1.2em; font-weight:600; color:#2e7dff;'>Your AI-powered Coding Companion for Learning & Building</p>
""", unsafe_allow_html=True)


# Sidebar navigation with icons
st.sidebar.title("🚀 Navigation")

# Theme switcher
bg_theme = st.sidebar.selectbox(
    "Choose Background Theme",
    ["Dark Gradient"],
    index=0
)

if bg_theme == "Dark Gradient":
    st.markdown("""
    <style>
    body, .stApp { background: linear-gradient(135deg, #181c24 0%, #232b3a 100%) !important; color: #f3f6fa !important; }
    .card { background: #232b3a; color: #f3f6fa; }
    .header { background: #232b3a; }
    .stSidebar { background: #181c24 !important; color: #f3f6fa !important; }
    </style>
    """, unsafe_allow_html=True)

menu_option = st.sidebar.radio("Go to", [
    "🏠 Home",
    "📖 Explain Code",
    "🛠 Debug Code",
    "💡 Generate Code",
    "🔄 Convert Logic",
    "📊 Complexity Analysis",
    "🔍 Code Tracer",
    "📚 Snippets Library",
    "💡 Project Ideas",
    "🗺 Learning Roadmap"
])

API_URL = "http://127.0.0.1:8000"

def fetch_response(endpoint, payload):
    try:
        r = requests.post(f"{API_URL}/{endpoint}", json=payload)
        data = r.json()
        if "response" in data:
            return data["response"]
        else:
            st.error("⚠️ Unexpected API response")
    except Exception as e:
        st.error(f"🚨 API request failed: {e}")

# User inputs
language = st.selectbox("Select Language", ["Python", "JavaScript", "Java", "C++", "Ruby", "Go"])
topic = st.text_input("Enter Topic / Logic / Question")
level = st.selectbox("Select Level", ["Beginner", "Intermediate", "Advanced"])
code_input = st.text_area("Paste your code here", height=200)

# Main content based on selection
if menu_option == "🏠 Home":
    st.title("Welcome to KodesCRUxxx!")
    st.markdown("""
    <div style='text-align:center; margin-bottom: 2em;'>
        <h3 style='color:#6ec1e4;'>AI Coding Assistant for Students & Developers</h3>
        <p style='font-size:1.1em; color:#b0c4d4;'>KodesCRUxxx is your all-in-one AI-powered coding companion. Learn, debug, generate, and analyze code with ease. Designed for a seamless, mobile-friendly experience.</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Feature grid with clickable icons that navigate to feature pages and show backend results
    feature_map = [
        ("📖", "Explain Code", "Get beginner-friendly explanations for any code snippet.", "Understanding is the first step to mastery.", "explain", {"language": language, "topic": topic, "level": level}),
        ("🛠", "Debug Code", "Find and fix bugs and logical errors instantly.", "Every bug is an opportunity to learn.", "debug", {"language": language, "topic": topic}),
        ("💡", "Generate Code", "Create code snippets, templates, and solutions on demand.", "Creativity is intelligence having fun.", "generate", {"language": language, "topic": topic, "level": level}),
        ("🔄", "Convert Logic", "Turn pseudo-code or logic into real code.", "Logic is the beginning of wisdom.", "convert_logic", {"logic": topic, "language": language}),
        ("📊", "Complexity Analysis", "Analyze time and space complexity of algorithms.", "Efficiency is doing better what is already being done.", "analyze_complexity", {"code": code_input}),
        ("🔍", "Code Tracer", "Visualize code execution step-by-step.", "Trace the path, master the journey.", "trace_code", {"code": code_input, "language": language}),
        ("📚", "Snippets Library", "Access a curated collection of useful code snippets.", "Reuse, remix, reinvent.", "get_snippets", {"language": language, "snippet": topic}),
        ("💡", "Project Ideas", "Get project suggestions and learning paths.", "Every project starts with an idea.", "get_projects", {"level": level, "topic": topic}),
        ("🗺", "Learning Roadmap", "Personalized roadmaps for your coding journey.", "A roadmap turns dreams into plans.", "get_roadmaps", {"level": level, "topic": topic})
    ]
    cols = st.columns(3)
    icon_clicked = st.session_state.get("icon_clicked", None)
    for i, (icon, label, desc, quote, endpoint, payload) in enumerate(feature_map):
        with cols[i % 3]:
            if st.button(f"{icon}\n{label}", key=f"feature_{i}"):
                st.session_state["menu_option"] = label
                st.session_state["icon_clicked"] = (label, endpoint, payload)
                st.rerun()
            st.markdown(f"<div style='font-size:0.95em; color:#b0c4d4; text-align:center;'>{desc}<br><i>\"{quote}\"</i></div>", unsafe_allow_html=True)
    # Show backend result if an icon was clicked and still on Home
    if icon_clicked and st.session_state.get("menu_option", "🏠 Home") == "🏠 Home":
        label, endpoint, payload = icon_clicked
        with st.spinner(f"Loading {label}..."):
            resp = fetch_response(endpoint, payload)
            if resp:
                st.markdown(f"<div class='card'><h4>{label}</h4>{resp}</div>", unsafe_allow_html=True)
    # Clear icon_clicked if not on Home
    elif st.session_state.get("menu_option", "🏠 Home") != "🏠 Home":
        st.session_state["icon_clicked"] = None
    st.markdown("""
    <div style='margin:2.5em auto 0 auto; max-width: 800px; background:#232b3a; border-radius:16px; box-shadow:0 2px 16px rgba(20,30,50,0.25); padding:2em 2em 1.5em 2em;'>
        <h3 style='color:#6ec1e4;'>About KodesCRUxxx</h3>
        <p style='font-size:1.1em; color:#b0c4d4;'>KodesCRUxxx is an AI-powered coding assistant designed to help you learn, debug, generate, and analyze code efficiently. Whether you're a student or a developer, KodesCRUxxx offers a rich set of features to enhance your programming journey, all accessible through a sleek, mobile-friendly interface.<br><br>Start exploring from the navigation menu and supercharge your coding experience!</p>
    </div>
    """, unsafe_allow_html=True)
    st.stop()

elif menu_option == "📖 Explain Code":
    if st.button("Explain Code", key="explain"):
        with st.spinner("Generating explanation..."):
            resp = fetch_response("explain", {"language": language, "topic": topic, "level": level})
            if resp:
                st.markdown("<div class='card'><h4>📖 Explanation</h4>" + resp + "</div>", unsafe_allow_html=True)

elif menu_option == "🛠 Debug Code":
    if st.button("Debug Code", key="debug"):
        with st.spinner("Debugging code..."):
            resp = fetch_response("debug", {"language": language, "topic": topic})
            if resp:
                st.markdown("<div class='card'><h4>🛠 Debugging</h4>" + resp + "</div>", unsafe_allow_html=True)

elif menu_option == "💡 Generate Code":
    if st.button("Generate Code", key="generate"):
        with st.spinner("Generating code..."):
            resp = fetch_response("generate", {"language": language, "topic": topic, "level": level})
            if resp:
                st.markdown("<div class='card'><h4>💡 Code Example</h4>", unsafe_allow_html=True)
                st.code(resp, language=language.lower())
                st.markdown("</div>", unsafe_allow_html=True)

elif menu_option == "🔄 Convert Logic":
    logic_input = st.text_area("Enter your logic or pseudo-code")
    target_lang = st.selectbox("Target Language", ["Python", "JavaScript", "Java", "C++", "Ruby", "Go"])
    if st.button("Convert to Code", key="convert"):
        with st.spinner("Converting logic to code..."):
            resp = fetch_response("convert_logic", {"logic": logic_input, "language": target_lang})
            if resp:
                st.markdown("<div class='card'><h4>🔄 Converted Code</h4>", unsafe_allow_html=True)
                st.code(resp, language=target_lang.lower())
                st.markdown("</div>", unsafe_allow_html=True)

elif menu_option == "📊 Complexity Analysis":
    algo_input = st.text_area("Describe your algorithm or paste code")
    if st.button("Analyze Complexity", key="complexity"):
        with st.spinner("Analyzing complexity..."):
            resp = fetch_response("analyze_complexity", {"code": algo_input})
            if resp:
                st.markdown("<div class='card'><h4>📊 Time & Space Complexity</h4>" + resp + "</div>", unsafe_allow_html=True)

elif menu_option == "🔍 Code Tracer":
    tracer_input = st.text_area("Paste your code for tracing")
    if st.button("Trace Code", key="trace"):
        with st.spinner("Tracing code..."):
            resp = fetch_response("trace_code", {"code": tracer_input, "language": language})
            if resp:
                st.markdown("<div class='card'><h4>🔍 Code Trace</h4>" + resp + "</div>", unsafe_allow_html=True)

elif menu_option == "📚 Snippets Library":
    snippets = {
        "Python": ["Hello World", "Factorial"],
        "JavaScript": ["Alert", "Fetch"]
    }
    selected_snippet = st.selectbox("Select Snippet", snippets.get(language, []))
    if st.button("Get Snippet", key="snippet"):
        resp = fetch_response("get_snippets", {"language": language, "snippet": selected_snippet})
        if resp:
            st.markdown("<div class='card'><h4>📚 Snippet</h4>", unsafe_allow_html=True)
            st.code(resp, language=language.lower())
            st.markdown("</div>", unsafe_allow_html=True)

elif menu_option == "💡 Project Ideas":
    if st.button("Get Project Ideas", key="projects"):
        with st.spinner("Fetching project ideas..."):
            resp = fetch_response("get_projects", {"level": level, "topic": topic})
            if resp:
                st.markdown("<div class='card'><h4>💡 Project Ideas</h4>" + resp + "</div>", unsafe_allow_html=True)

elif menu_option == "🗺 Learning Roadmap":
    if st.button("Get Roadmap", key="roadmap"):
        with st.spinner("Generating roadmap..."):
            resp = fetch_response("get_roadmaps", {"level": level, "topic": topic})
            if resp:
                st.markdown("<div class='card'><h4>🗺 Learning Roadmap</h4>" + resp + "</div>", unsafe_allow_html=True)

# End of content
st.markdown('&lt;/div>', unsafe_allow_html=True)
