(function (window, $) {
  'use strict';

  const config = window.WorkBridgeConfig;

  function getCredentials() {
    try {
      const raw = localStorage.getItem(config.storageKey);
      if (!raw) {
        return { email: '', token: '', baseUrl: config.defaultBaseUrl };
      }
      return Object.assign(
        { email: '', token: '', baseUrl: config.defaultBaseUrl },
        JSON.parse(raw),
      );
    } catch (err) {
      return { email: '', token: '', baseUrl: config.defaultBaseUrl };
    }
  }

  function saveCredentials(creds) {
    localStorage.setItem(config.storageKey, JSON.stringify(creds));
  }

  function clearCredentials() {
    localStorage.removeItem(config.storageKey);
  }

  function authHeaders(creds) {
    const headers = { 'Content-Type': 'application/json' };
    if (creds.email) headers['X-Jira-Email'] = creds.email;
    if (creds.token) headers['X-Jira-Api-Token'] = creds.token;
    if (creds.baseUrl) headers['X-Jira-Base-Url'] = creds.baseUrl;
    return headers;
  }

  function request(path, options) {
    const creds = getCredentials();
    const opts = options || {};
    return $.ajax({
      url: config.apiBaseUrl.replace(/\/$/, '') + path,
      method: opts.method || 'GET',
      data: opts.body ? JSON.stringify(opts.body) : undefined,
      headers: authHeaders(creds),
      contentType: 'application/json',
      dataType: 'json',
    }).then(function (payload) {
      return payload.data !== undefined ? payload.data : payload;
    });
  }

  window.WorkBridgeApi = {
    getCredentials: getCredentials,
    saveCredentials: saveCredentials,
    clearCredentials: clearCredentials,
    health: function () {
      return $.getJSON(config.apiBaseUrl.replace(/\/$/, '') + '/health');
    },
    listProjects: function () {
      return request('/jira/projects');
    },
    listIssues: function (projectKey) {
      return request('/jira/projects/' + encodeURIComponent(projectKey) + '/issues');
    },
    getStandup: function (projectKey) {
      return request('/jira/projects/' + encodeURIComponent(projectKey) + '/standup');
    },
    postStandup: function (projectKey, channel) {
      return request('/jira/projects/' + encodeURIComponent(projectKey) + '/standup', {
        method: 'POST',
        body: channel ? { channel: channel } : {},
      });
    },
  };
})(window, jQuery);
