// ❗ 중요: Google Apps Script 배포 후 생성된 '웹 앱 URL'을 여기에 붙여넣으세요.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzBniBCRqjJP51dVOFUQRl_Cb1d1FAGfdIH60az9DnSSgdx1iAScDKnS_7TNx-Evc/exec';

const messagesContainer = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');

function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    
    // 줄바꿈 처리
    text = text.replace(/\n/g, '<br>');
    msgDiv.innerHTML = text; // innerHTML을 사용하여 HTML 태그(br, b 등) 렌더링
    
    messagesContainer.appendChild(msgDiv);
    scrollToBottom();
}

function showLoading() {
    let loading = document.getElementById('loading-indicator');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loading-indicator';
        loading.classList.add('loading');
        loading.textContent = '답변을 생성하는 중...';
        messagesContainer.appendChild(loading);
    }
    loading.style.display = 'block';
    scrollToBottom();
}

function hideLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.style.display = 'none';
    }
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // 사용자 메시지 화면에 추가
    addMessage(text, 'user');
    userInput.value = '';
    
    // 로딩 표시
    showLoading();

    try {
        // CORS 프리플라이트 요청 방지를 위해 Content-Type을 text/plain으로 전송
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ message: text })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        hideLoading();
        addMessage(data.reply || "응답 내용이 없습니다.", 'bot');
    } catch (error) {
        hideLoading();
        console.error('API 통신 에러:', error);
        
        if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
            addMessage("시스템 오류: script.js 파일에서 SCRIPT_URL 값을 Google Apps Script 주소로 변경해주세요.", 'bot');
        } else {
            addMessage("서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요. (" + error.message + ")", 'bot');
        }
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// 윈도우 로드 시 입력창 포커스
window.onload = function() {
    userInput.focus();
};
