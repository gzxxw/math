// ============================================================
//  auth.js  —  认证模块
//  账户密码验证，密码加密存储
// ============================================================

const Auth = {
  // 用户名（base64编码）
  username: 'MTU5ODQ2NDAyOTdAMTYzLmNvbQ==',
  
  // 密码哈希（MD5加密，非明文）
  passwordHash: '0b4111913d181ef6d5c1a93ad777e041',
  
  // 登录状态
  isLoggedIn: false,
  
  // 计算密码哈希（MD5）
  hashPassword(pwd) {
    function md5(string) {
      function rotateLeft(lValue, iShiftBits) {
        return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
      }
      function addUnsigned(lX,lY) {
        var lX4,lY4,lX8,lY8,lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
        if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        if (lX4 | lY4) {
          if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
          else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        } else return (lResult ^ lX8 ^ lY8);
      }
      function F(x,y,z) { return (x & y) | ((~x) & z); }
      function G(x,y,z) { return (x & z) | (y & (~z)); }
      function H(x,y,z) { return (x ^ y ^ z); }
      function I(x,y,z) { return (y ^ (x | (~z))); }
      function FF(a,b,c,d,x,s,ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
      }
      function GG(a,b,c,d,x,s,ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
      }
      function HH(a,b,c,d,x,s,ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
      }
      function II(a,b,c,d,x,s,ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
      }
      function convertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1 = lMessageLength + 8;
        var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64))/64;
        var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
        var lWordArray=Array(lNumberOfWords-1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while (lByteCount < lMessageLength) {
          lWordCount = (lByteCount-(lByteCount % 4))/4;
          lBytePosition = (lByteCount % 4)*8;
          lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
          lByteCount++;
        }
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
        lWordArray[lNumberOfWords-2] = lMessageLength<<3;
        lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
        return lWordArray;
      }
      function wordToHex(lValue) {
        var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
        for (lCount=0;lCount<=3;lCount++) {
          lByte = (lValue>>>(lCount*8)) & 255;
          WordToHexValue_temp = "0"+lByte.toString(16);
          WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
        }
        return WordToHexValue;
      }
      var x=Array();
      var k,AA,BB,CC,DD,a,b,c,d;
      var S11=7, S12=12, S13=17, S14=22;
      var S21=5, S22=9 , S23=14, S24=20;
      var S31=4, S32=11, S33=16, S34=23;
      var S41=6, S42=10, S43=15, S44=21;
      string = unescape(encodeURIComponent(string));
      var x=convertToWordArray(string);
      var a=0x67452301,b=0xEFCDAB89,c=0x98BADCFE,d=0x10325476;
      for (k=0;k<x.length;k+=16) {
        AA=a;BB=b;CC=c;DD=d;
        a=FF(a,b,c,d,x[k+0],S11,0xD76AA478);
        d=FF(d,a,b,c,x[k+1],S12,0xE8C7B756);
        c=FF(c,d,a,b,x[k+2],S13,0x242070DB);
        b=FF(b,c,d,a,x[k+3],S14,0xC1BDCEEE);
        a=FF(a,b,c,d,x[k+4],S11,0xF57C0FAF);
        d=FF(d,a,b,c,x[k+5],S12,0x4787C62A);
        c=FF(c,d,a,b,x[k+6],S13,0xA8304613);
        b=FF(b,c,d,a,x[k+7],S14,0xFD469501);
        a=FF(a,b,c,d,x[k+8],S11,0x698098D8);
        d=FF(d,a,b,c,x[k+9],S12,0x8B44F7AF);
        c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
        b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
        a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
        d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
        c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
        b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
        a=GG(a,b,c,d,x[k+1],S21,0xF61E2562);
        d=GG(d,a,b,c,x[k+6],S22,0xC040B340);
        c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
        b=GG(b,c,d,a,x[k+0],S24,0xE9B6C7AA);
        a=GG(a,b,c,d,x[k+5],S21,0xD62F105D);
        d=GG(d,a,b,c,x[k+10],S22,0x02441453);
        c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
        b=GG(b,c,d,a,x[k+4],S24,0xE7D3FBC8);
        a=GG(a,b,c,d,x[k+9],S21,0x21E1CDE6);
        d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
        c=GG(c,d,a,b,x[k+3],S23,0xF4D50D87);
        b=GG(b,c,d,a,x[k+8],S24,0x455A14ED);
        a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
        d=GG(d,a,b,c,x[k+2],S22,0xFCEFA3F8);
        c=GG(c,d,a,b,x[k+7],S23,0x676F02D9);
        b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
        a=HH(a,b,c,d,x[k+5],S31,0xFFFA3942);
        d=HH(d,a,b,c,x[k+8],S32,0x8771F681);
        c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
        b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
        a=HH(a,b,c,d,x[k+1],S31,0xA4BEEA44);
        d=HH(d,a,b,c,x[k+4],S32,0x4BDECFA9);
        c=HH(c,d,a,b,x[k+7],S33,0xF6BB4B60);
        b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
        a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
        d=HH(d,a,b,c,x[k+0],S32,0xEAA127FA);
        c=HH(c,d,a,b,x[k+3],S33,0xD4EF3085);
        b=HH(b,c,d,a,x[k+6],S34,0x04881D05);
        a=HH(a,b,c,d,x[k+9],S31,0xD9D4D039);
        d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
        c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
        b=HH(b,c,d,a,x[k+2],S34,0xC4AC5665);
        a=II(a,b,c,d,x[k+0],S41,0xF4292244);
        d=II(d,a,b,c,x[k+7],S42,0x432AFF97);
        c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
        b=II(b,c,d,a,x[k+5],S44,0xFC93A039);
        a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
        d=II(d,a,b,c,x[k+3],S42,0x8F0CCC92);
        c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
        b=II(b,c,d,a,x[k+1],S44,0x85845DD1);
        a=II(a,b,c,d,x[k+8],S41,0x6FA87E4F);
        d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
        c=II(c,d,a,b,x[k+6],S43,0xA3014314);
        b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
        a=II(a,b,c,d,x[k+4],S41,0xF7537E82);
        d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
        c=II(c,d,a,b,x[k+2],S43,0x2AD7D2BB);
        b=II(b,c,d,a,x[k+9],S44,0xEB86D391);
        a=addUnsigned(a,AA);
        b=addUnsigned(b,BB);
        c=addUnsigned(c,CC);
        d=addUnsigned(d,DD);
      }
      var temp = wordToHex(a)+wordToHex(b)+wordToHex(c)+wordToHex(d);
      return temp.toLowerCase();
    }
    return md5(pwd);
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
          <input type="text" id="login-username" placeholder="输入邮箱">
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
