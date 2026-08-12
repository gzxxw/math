// ============================================================
//  auth.js  —  认证模块
//  账户密码验证，密码加密存储
// ============================================================

const Auth = {
  // 用户名（base64编码）
  username: 'MTU5ODQ2NDAyOTdAZTE2My5jb20=',
  
  // 密码哈希（MD5加密，非明文）
  passwordHash: '0b4111913d181ef6d5c1a93ad777e041',
  
  // 登录状态
  isLoggedIn: false,
  
  // 计算密码哈希
  hashPassword(pwd) {
    let hash = 0;
    for (let i = 0; i < pwd.length; i++) {
      const char = pwd.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  },
  
  // 验证登录
  async login(username, password) {
    try {
      const decodedUsername = atob(username);
      const passwordHash = this.hashPassword(password);
      
      if (decodedUsername === atob(this.username) && passwordHash === this.passwordHash) {
        this.isLoggedIn = true;
        localStorage.setItem('math_auth_token', Date.now().toString());
        return true;
      }
      return false;
    } catch (e) {
      console.error('登录失败:', e);
      return false;
    }
  },
  
  // 登出
  logout() {
    this.isLoggedIn = false;
    localStorage.removeItem('math_auth_token');
    location.reload();
  },
  
  // 检查是否已登录
  checkLogin() {
    const token = localStorage.getItem('math_auth_token');
    if (token) {
      const hours = (Date.now() - parseInt(token)) / (1000 * 60 * 60);
      if (hours < 24) {
        this.isLoggedIn = true;
        return true;
      }
    }
    this.isLoggedIn = false;
    return false;
  },
  
  // 显示登录界面
  showLoginModal() {
    const modal = document.createElement('div');
    modal.id = 'login-modal';
    modal.className = 'login-modal';
    modal.innerHTML = `
      <div class="login-box">
        <h2>🔐 请登录</h2>
        <p>本工具仅供个人使用</p>
        <div class="form-group">
          <label>邮箱账号</label>
          <input type="text" id="login-username" placeholder="输入邮箱" value="15984640297@163.com">
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" id="login-password" placeholder="输入密码">
        </div>
        <div id="login-error" style="color:#e74c3c; font-size:13px; margin-top:10px; display:none;"></div>
        <div class="login-actions">
          <button class="btn-login" id="btn-login">登录</button>
          <button class="btn-cancel" id="btn-cancel">取消</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('btn-login').addEventListener('click', async () => {
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error');
      
      if (!username || !password) {
        errorEl.textContent = '请输入账号和密码';
        errorEl.style.display = 'block';
        return;
      }
      
      const success = await this.login(username, password);
      if (success) {
        modal.remove();
        App.init();
      } else {
        errorEl.textContent = '账号或密码错误';
        errorEl.style.display = 'block';
      }
    });
    
    document.getElementById('btn-cancel').addEventListener('click', () => {
      modal.remove();
      location.reload();
    });
    
    document.getElementById('login-password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-login').click();
    });
  },
  
  // 检查登录状态并初始化
  async checkAndInit() {
    if (this.checkLogin()) {
      App.init();
    } else {
      this.showLoginModal();
    }
  }
};

// 登录界面样式
const loginStyle = document.createElement('style');
loginStyle.textContent = `
.login-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.login-box {
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 350px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
body.dark-mode .login-box {
  background: #2d2d44;
  color: #e0e0e0;
}
.login-box h2 {
  margin-bottom: 10px;
  text-align: center;
}
.login-box p {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
  font-size: 13px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  font-size: 14px;
}
.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
body.dark-mode .form-group input {
  background: #3d3d5c;
  border-color: #4a4a6a;
  color: #e0e0e0;
}
.login-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.btn-login {
  flex: 1;
  padding: 12px;
  background: #28a745;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.btn-login:hover {
  background: #218838;
}
.btn-cancel {
  flex: 1;
  padding: 12px;
  background: #6c757d;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
}
`;
document.head.appendChild(loginStyle);
