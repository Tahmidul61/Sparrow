// ═══════════════════════════════════════════════════════════════
// biometric.js — WebAuthn biometric login (fingerprint / Face ID)
// Standalone file — does NOT modify any existing files
// Include AFTER auth.js on login.html if you want biometric there
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  var STORAGE_KEY = 'bismiAuthCredential';
  var RP_ID = window.location.hostname;
  var RP_NAME = 'Bismi Treats';

  // ── HELPERS ──────────────────────────────────────────────────
  function base64ToBuffer(base64) {
    var bin = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    var buf = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf.buffer;
  }

  function bufferToBase64(buffer) {
    var bytes = new Uint8Array(buffer);
    var bin = '';
    for (var i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  function randomBytes(len) {
    var arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return arr;
  }

  function getSavedCredential() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveCredential(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function clearCredential() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  // ── PUBLIC API ────────────────────────────────────────────────
  var BismiAuth = {

    // Check if WebAuthn is supported on this device/browser
    isSupported: function () {
      return !!(window.PublicKeyCredential &&
        navigator.credentials &&
        navigator.credentials.create &&
        navigator.credentials.get);
    },

    // Check if a credential is already registered on this device
    isRegistered: function () {
      return !!getSavedCredential();
    },

    // Register biometric (fingerprint / Face ID)
    // Returns Promise<boolean>
    register: function (username) {
      if (!this.isSupported()) {
        return Promise.reject(new Error('WebAuthn not supported on this device'));
      }
      username = username || 'staff';
      var challenge = randomBytes(32);
      var userId = randomBytes(16);

      var options = {
        challenge: challenge,
        rp: { id: RP_ID, name: RP_NAME },
        user: {
          id: userId,
          name: username + '@bismitreats',
          displayName: 'Bismi Staff'
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7  },  // ES256
          { type: 'public-key', alg: -257 }  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',  // device biometric only
          userVerification: 'required',
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: 'none'
      };

      return navigator.credentials.create({ publicKey: options })
        .then(function (credential) {
          if (!credential) return false;
          // Save credential ID for future authentication
          var credData = {
            id: credential.id,
            rawId: bufferToBase64(credential.rawId),
            type: credential.type,
            username: username,
            registeredAt: new Date().toISOString()
          };
          saveCredential(credData);
          return true;
        });
    },

    // Authenticate with biometric
    // Returns Promise<boolean>
    authenticate: function () {
      if (!this.isSupported()) {
        return Promise.reject(new Error('WebAuthn not supported on this device'));
      }
      var saved = getSavedCredential();
      if (!saved) {
        return Promise.reject(new Error('No biometric registered. Please register first.'));
      }

      var challenge = randomBytes(32);
      var options = {
        challenge: challenge,
        rpId: RP_ID,
        allowCredentials: [{
          type: 'public-key',
          id: base64ToBuffer(saved.rawId),
          transports: ['internal']
        }],
        userVerification: 'required',
        timeout: 60000
      };

      return navigator.credentials.get({ publicKey: options })
        .then(function (assertion) {
          return !!assertion;
        });
    },

    // Remove registered biometric
    unregister: function () {
      clearCredential();
    },

    // Get info about registered credential
    getInfo: function () {
      var saved = getSavedCredential();
      if (!saved) return null;
      return {
        username: saved.username,
        registeredAt: saved.registeredAt
      };
    }
  };

  // Expose globally
  window.BismiAuth = BismiAuth;

})();


// ═══════════════════════════════════════════════════════════════
// HOW TO ADD BIOMETRIC TO login.html:
//
// 1. Add this script tag to login.html (before closing </body>):
//    <script src="js/biometric.js"></script>
//
// 2. Add a biometric button to the PIN screen:
//    <button id="bioLoginBtn" onclick="tryBiometricLogin()" style="display:none">
//      <i class="fas fa-fingerprint"></i> Use Fingerprint / Face ID
//    </button>
//
// 3. Add this JS to login.html:
//    function initBiometricBtn(){
//      if(window.BismiAuth && BismiAuth.isSupported() && BismiAuth.isRegistered()){
//        document.getElementById('bioLoginBtn').style.display = 'flex';
//      }
//    }
//    function tryBiometricLogin(){
//      BismiAuth.authenticate().then(function(ok){
//        if(ok){
//          // Same as successful PIN — redirect to role page
//          var role = localStorage.getItem('bismiStaffRole') || 'admin';
//          window.location.href = role + '.html';
//        }
//      }).catch(function(e){
//        alert('Biometric failed: ' + e.message);
//      });
//    }
//    // Call on page load:
//    initBiometricBtn();
// ═══════════════════════════════════════════════════════════════