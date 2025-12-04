# coding: utf-8

from flask import Flask, request, render_template_string

app = Flask(__name__)

# 假設有一個簡單的用戶資料庫（只用字典來模擬）
users_db = {
    "admin": "password123",
    "user": "userpassword"
}

# 設置一個簡單的首頁，顯示登錄表單
@app.route('/')
def index():
    return render_template_string('''
        <form method="POST" action="/login">
            <label for="username">Username:</label>
            <input type="text" id="username" name="username">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password">
            <button type="submit">Login</button>
        </form>
    ''')

# 處理用戶登入
@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')

    # 故意留下 SQL 注入漏洞
    if username in users_db and users_db[username] == password:
        if username == "admin":
            return "Welcome admin! Here is your flag: FLAG{SQL_INJECTION_SUCCESS}"
        else:
            return "Welcome user!"
    else:
        return "Invalid credentials!"

if __name__ == "__main__":
    app.run(debug=True)
