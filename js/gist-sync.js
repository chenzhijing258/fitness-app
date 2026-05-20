// js/gist-sync.js — GitHub Gist cloud sync
// No SDK required. Uses fetch() + GitHub REST API.
// Token and Gist ID are stored in localStorage under non-synced keys.

var _syncTimer = null;
var GIST_TOKEN_KEY  = 'fa_gist_token';   // not in KEYS, never synced to cloud
var GIST_ID_KEY     = 'fa_gist_id';      // not in KEYS, never synced to cloud
var GIST_FILENAME   = 'fitness-app-data.json';

/** Returns the stored GitHub PAT, or empty string. */
function getGistToken() {
  return localStorage.getItem(GIST_TOKEN_KEY) || '';
}

/** Returns the stored Gist ID, or empty string. */
function getGistId() {
  return localStorage.getItem(GIST_ID_KEY) || '';
}

/** Standard headers for GitHub API requests. */
function _gistHeaders(token) {
  return {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };
}

/**
 * Builds the Gist file content: a JSON string whose keys are the fa_* localStorage keys
 * and whose values are the raw localStorage strings for each key.
 * Example: '{"fa_students":"[{...}]","fa_sessions":"[]",...}'
 */
function _gistPayload() {
  var content = {};
  // KEYS is defined in data.js; safe because _gistPayload is only called at runtime
  Object.values(KEYS).forEach(function(key) {
    content[key] = localStorage.getItem(key) || '';
  });
  return JSON.stringify(content);
}

/**
 * Upload all fa_* keys to the Gist.
 * Creates a new private Gist if none exists yet (stores the new Gist ID in localStorage).
 * Called automatically 2 seconds after any _save() via scheduleSyncToCloud().
 */
async function _doSyncToCloud() {
  var token = getGistToken();
  if (!token) return;

  try {
    var fileContent = _gistPayload();
    var gistId = getGistId();

    if (gistId) {
      // Update existing Gist
      var resp = await fetch('https://api.github.com/gists/' + gistId, {
        method: 'PATCH',
        headers: _gistHeaders(token),
        body: JSON.stringify({
          files: {
            [GIST_FILENAME]: { content: fileContent }
          }
        })
      });
      if (!resp.ok) {
        console.warn('[gist-sync] PATCH failed:', resp.status);
      }
    } else {
      // First sync — create a new secret Gist
      var createResp = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: _gistHeaders(token),
        body: JSON.stringify({
          description: '健身助手数据备份（自动生成，请勿手动删除）',
          public: false,
          files: {
            [GIST_FILENAME]: { content: fileContent }
          }
        })
      });
      if (createResp.ok) {
        var data = await createResp.json();
        if (data.id) {
          localStorage.setItem(GIST_ID_KEY, data.id);
        }
      } else {
        console.warn('[gist-sync] POST failed:', createResp.status);
      }
    }
  } catch (e) {
    console.warn('[gist-sync] upload failed:', e.message);
  }
}

/**
 * Debounce wrapper for _doSyncToCloud.
 * Called from _save() in data.js on every write.
 * Multiple rapid saves (e.g., runAutoComplete marking several sessions done)
 * collapse into one upload 2 seconds after the last save.
 */
function scheduleSyncToCloud() {
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(_doSyncToCloud, 2000);
}

/**
 * Fetch the Gist and update localStorage for any key that differs.
 * Returns true if at least one key changed (caller may want to re-render).
 * Returns false if no token, no Gist ID, network error, or no changes.
 */
async function syncFromCloud() {
  var token  = getGistToken();
  var gistId = getGistId();
  if (!token || !gistId) return false;

  try {
    var resp = await fetch('https://api.github.com/gists/' + gistId, {
      headers: _gistHeaders(token)
    });
    if (!resp.ok) return false;

    var data = await resp.json();
    var file = data.files && data.files[GIST_FILENAME];
    if (!file || !file.content) return false;

    var cloudData = JSON.parse(file.content);
    var changed = false;
    Object.values(KEYS).forEach(function(key) {
      var cloudVal = cloudData[key];
      if (cloudVal == null) return;
      if (localStorage.getItem(key) !== cloudVal) {
        localStorage.setItem(key, cloudVal);
        changed = true;
      }
    });
    return changed;
  } catch (e) {
    console.warn('[gist-sync] download failed:', e.message);
    return false;
  }
}

/**
 * Test whether a given PAT is valid and has gist scope.
 * Returns { ok: boolean, msg: string } — msg is shown directly in the UI.
 */
async function testGistConnection(token) {
  try {
    var resp = await fetch('https://api.github.com/user', {
      headers: _gistHeaders(token)
    });
    if (!resp.ok) {
      return { ok: false, msg: 'Token 无效，请确认已勾选 gist 权限' };
    }
    var userData = await resp.json();
    return { ok: true, msg: '连接成功：' + (userData.login || '已认证') };
  } catch (e) {
    return { ok: false, msg: '网络错误：' + e.message };
  }
}

/**
 * Save a new PAT. Clears the stored Gist ID so the next sync creates a fresh Gist
 * if the token belongs to a different account.
 */
function saveGistToken(token) {
  if (token) {
    localStorage.setItem(GIST_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(GIST_TOKEN_KEY);
    localStorage.removeItem(GIST_ID_KEY);
  }
}
