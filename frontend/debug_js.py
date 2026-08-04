import subprocess
import time
import os
import sys
import json
import urllib.request

def run_debug():
    os.system("taskkill /f /im chrome.exe >nul 2>&1")
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    print(f"Launching chrome from {chrome_path}...")
    proc = subprocess.Popen([
        chrome_path,
        "--remote-debugging-port=9222",
        "--headless",
        "--disable-gpu",
        "http://localhost:3000"
    ])
    time.sleep(3.0)
    
    try:
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        targets = json.loads(req.read().decode('utf-8'))
        
        page_targets = [t for t in targets if t.get("type") == "page" and "localhost:3000" in t.get("url", "")]
        if not page_targets:
            print("Emberfall page target not found.")
            return
            
        target = page_targets[0]
        ws_url = target.get("webSocketDebuggerUrl")
        print(f"Connecting to devtools WebSocket: {ws_url}")
        
        ws_path = ws_url.split("9222")[1]
        
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("127.0.0.1", 9222))
        
        handshake = (
            f"GET {ws_path} HTTP/1.1\r\n"
            "Host: 127.0.0.1:9222\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        )
        s.sendall(handshake.encode())
        resp = s.recv(4096).decode('utf-8', errors='ignore')
        if "101" not in resp:
            print("WebSocket handshake failed:", resp)
            return
            
        print("Connected to DevTools WebSocket successfully!")
        
        def send_ws_json(msg_obj):
            payload = json.dumps(msg_obj)
            payload_len = len(payload)
            header = bytearray()
            header.append(0x81)
            if payload_len <= 125:
                header.append(0x80 | payload_len)
            elif payload_len <= 65535:
                header.append(0x80 | 126)
                header.extend(payload_len.to_bytes(2, byteorder='big'))
            else:
                header.append(0x80 | 127)
                header.extend(payload_len.to_bytes(8, byteorder='big'))
            mask = b'\x00\x00\x00\x00'
            header.extend(mask)
            masked_payload = bytearray(payload.encode('utf-8'))
            s.sendall(header + masked_payload)

        # Enable Console, Log, and Runtime
        send_ws_json({"id": 1, "method": "Console.enable"})
        send_ws_json({"id": 2, "method": "Log.enable"})
        send_ws_json({"id": 3, "method": "Runtime.enable"})
        
        # Trigger page reload
        send_ws_json({"id": 4, "method": "Page.reload"})
        
        s.settimeout(1.0)
        time.sleep(2.0)
        
        print("Clicking start button...")
        send_ws_json({
            "id": 10,
            "method": "Runtime.evaluate",
            "params": {
                "expression": "document.getElementById('startBtn').click()"
            }
        })
        
        start_t = time.time()
        recv_buf = bytearray()
        s.settimeout(0.5)
        while time.time() - start_t < 6.0:
            try:
                data = s.recv(65536)
                if not data:
                    break
                recv_buf.extend(data)
                
                while len(recv_buf) >= 2:
                    byte0 = recv_buf[0]
                    byte1 = recv_buf[1]
                    opcode = byte0 & 0x0f
                    masked = (byte1 & 0x80) != 0
                    payload_len = byte1 & 0x7f
                    
                    curr = 2
                    if payload_len == 126:
                        if len(recv_buf) < curr + 2:
                            break
                        payload_len = int.from_bytes(recv_buf[curr:curr+2], byteorder='big')
                        curr += 2
                    elif payload_len == 127:
                        if len(recv_buf) < curr + 8:
                            break
                        payload_len = int.from_bytes(recv_buf[curr:curr+8], byteorder='big')
                        curr += 8
                        
                    if masked:
                        if len(recv_buf) < curr + 4:
                            break
                        mask_key = recv_buf[curr:curr+4]
                        curr += 4
                    else:
                        mask_key = None
                        
                    if len(recv_buf) < curr + payload_len:
                        break
                        
                    payload = recv_buf[curr:curr+payload_len]
                    recv_buf = recv_buf[curr+payload_len:]
                    
                    if opcode == 1:  # Text frame
                        if mask_key:
                            payload = bytearray(b ^ mask_key[i % 4] for i, b in enumerate(payload))
                        try:
                            msg_str = payload.decode('utf-8', errors='ignore')
                            msg = json.loads(msg_str)
                            method = msg.get("method")
                            params = msg.get("params", {})
                            if method == "Runtime.exceptionThrown":
                                details = params.get("exceptionDetails", {})
                                exception = details.get("exception", {})
                                print(f"\n[EXCEPTION] {details.get('text')} - {exception.get('description')}")
                            elif method == "Console.messageAdded":
                                message = params.get("message", {})
                                print(f"\n[CONSOLE] {message.get('level').upper()}: {message.get('text')}")
                            elif method == "Log.entryAdded":
                                entry = params.get("entry", {})
                                print(f"\n[LOG] {entry.get('level').upper()}: {entry.get('text')}")
                        except Exception as pe:
                            pass
            except socket.timeout:
                pass
                
    except Exception as e:
        print("Error connecting to CDP:", e)
    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    run_debug()
