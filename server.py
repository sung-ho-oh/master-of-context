import sys
import os
import json
import subprocess
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NOTEBOOK_ID = "2533eadb-b89a-429a-b5b5-44f21fd8c6ba"
NLM_CMD = r"C:\Users\USER\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts\nlm.exe"

@app.post("/chat")
async def chat_handler(request: Request):
    # Depending on how the frontend sends data (text/plain or application/json), we parse it
    try:
        body = await request.json()
    except:
        raw_body = await request.body()
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except:
            return {"reply": "서버 통신 에러: 잘못된 요청 형식입니다."}

    user_message = body.get("message", "")
    if not user_message:
        return {"reply": "메시지가 비어있습니다."}

    cmd = [
        NLM_CMD,
        "notebook",
        "query",
        NOTEBOOK_ID,
        user_message
    ]

    try:
        # We need to capture the JSON output. We set environment variable to ensure utf-8
        env = os.environ.copy()
        env["PYTHONUTF8"] = "1"
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode != 0:
            print("Error running nlm:", result.stderr)
            return {"reply": f"NotebookLM 연결 에러 발생: {result.stderr or '알 수 없는 에러'}"}
            
        # Parse the JSON response from nlm
        # nlm may output some startup warnings to stdout or stderr. Let's find the valid JSON block.
        stdout = result.stdout.strip()
        try:
            # find first '{' and last '}'
            start_idx = stdout.find("{")
            end_idx = stdout.rfind("}")
            if start_idx != -1 and end_idx != -1:
                json_str = stdout[start_idx:end_idx+1]
                data = json.loads(json_str)
                # handle "value": {"answer": "..."} structure if present
                if "value" in data and "answer" in data["value"]:
                    reply = data["value"]["answer"]
                else:
                    reply = data.get("answer", stdout)
                return {"reply": reply}
            else:
                 return {"reply": stdout}
                 
        except json.JSONDecodeError:
            print("Could not parse JSON:", stdout)
            return {"reply": "NotebookLM 응답 파싱 에러: " + stdout}

    except Exception as e:
        print("Exception:", e)
        return {"reply": f"서버 내부 에러: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
