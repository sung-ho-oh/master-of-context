/**
 * Google Apps Script 백엔드 컨트롤러
 * 1. 이 코드를 복사하여 script.google.com 새 프로젝트의 Code.gs 에 붙여넣으세요.
 * 2. YOUR_GEMINI_API_KEY 에 발급받은 실제 API 키 값을 넣으세요.
 * 3. [배포] -> [새 배포] -> 웹 앱: '나만', 액세스 권한: '모든 사용자' -> 배포
 * 4. 생성된 웹 앱 URL을 프론트엔드의 script.js 에 복사합니다.
 */

// ❗ 중요: 아래 변수에 Gemini API 키를 입력하세요.
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";

function doPost(e) {
  // CORS 및 클라이언트 통신용 기본 헤더
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  try {
    // 프론트엔드에서 Content-Type: text/plain 으로 보낸 JSON 파싱
    let requestData = {};
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    }
    
    const userMessage = requestData.message;

    if (!userMessage) {
      return buildResponse({ "reply": "메시지를 받지 못했습니다. 요청 형식을 확인하세요." });
    }

    // Gemini API 호출하여 응답 받아오기
    const replyText = callGeminiAPI(userMessage);

    // 성공적으로 JSON 반환
    return buildResponse({ "reply": replyText });

  } catch (error) {
    // 에러 발생 시 처리
    return buildResponse({ "reply": "서버 스크립트 에러 발생: " + error.toString() });
  }
}

function callGeminiAPI(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  // 챗봇 페르소나 설정
  const systemInstruction = `당신은 'Master of Context'라는 이름의 스마트하고 전문적인 지식 챗봇입니다.
친절하고 명확하게 한국어로 답변해주세요. 코드를 작성할 경우 마크다운 형식을 사용하고, 긴 답변은 가독성 좋게 적절히 띄어쓰기를 해주세요.`;
  
  const payload = {
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": prompt
          }
        ]
      }
    ],
    "systemInstruction": {
      "role": "model",
      "parts": [{ "text": systemInstruction }]
    }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  // 구글 API 페치 요청
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const json = JSON.parse(response.getContentText());

  if (responseCode !== 200) {
     return "Gemini API 오류 발생 (" + responseCode + "): " + (json.error ? json.error.message : "알 수 없는 에러");
  }

  // 성공적으로 응답 파싱
  if (json.candidates && json.candidates.length > 0) {
    return json.candidates[0].content.parts[0].text;
  } else {
    return "Gemini 모델이 내용 있는 답변을 생성하지 못했습니다.";
  }
}

function buildResponse(data) {
  // CORS 회피 및 JSONP 스타일 출력 시 활용하는 TextOutput 객체 생성
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// OPTIONS 요청 핸들러 (사전 요청 시 가벼운 성공 응답)
function doOptions(e) {
  return buildResponse({ "status": "ok" });
}
