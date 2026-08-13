(function (window, $) {
  'use strict';

  const api = window.WorkBridgeApi;
  const config = window.WorkBridgeConfig;
  const pageTitles = {
    standup: 'Standup',
    projects: 'Projects',
    issues: 'Issues',
    settings: 'Settings',
  };
  let projectNames = {};

  const PROJECT_STORAGE_KEY = 'workbridge.dashboard.projectKey';

  function projectKey() {
    return ($('#projectKeyInput').val() || config.defaultProjectKey).toString().trim().toUpperCase();
  }

  function projectLabel() {
    const key = projectKey();
    const name = projectNames[key];
    return name ? key + ' — ' + name : key;
  }

  function updatePageHeading(page) {
    const currentPage = page || $('.sidebar-nav .nav-link.active').data('page') || 'standup';
    const title = pageTitles[currentPage] || currentPage;
    $('#pageTitle').text(title);
    $('#pageCrumb').text('WorkBridge / ' + title + ' >> ' + projectLabel());
  }

  function saveProjectKey(key) {
    localStorage.setItem(PROJECT_STORAGE_KEY, key);
  }

  function loadSavedProjectKey() {
    return localStorage.getItem(PROJECT_STORAGE_KEY) || config.defaultProjectKey;
  }

  function updateScheduleCard() {
    const schedule = config.schedule || {};
    const scheduledProject = schedule.projectKey || config.defaultProjectKey;
    const selected = projectLabel();
    $('#cfoScheduleBadge').text((schedule.time || '09:00') + ' auto-send');
    $('#cfoScheduleText').html(
      'Automated standup runs <strong>' +
        (schedule.days || 'Mon–Fri') +
        ' at ' +
        (schedule.time || '09:00') +
        ' ' +
        (schedule.timezone || 'Europe/London') +
        '</strong> and <strong>will send a Slack message</strong> for project <strong>' +
        scheduledProject +
        '</strong> (' +
        (schedule.channelNote || 'configured Slack channel') +
        '). ' +
        'Manual “Post to Slack” uses your selected project: <strong>' +
        $('<div>').text(selected).html() +
        '</strong>.',
    );
  }

  function updatePostButtonLabel() {
    const key = projectKey();
    $('#btnPostStandup').text('Post ' + key + ' to Slack');
    $('#standupProjectHint').text(
      'Manual Slack post uses ' +
        projectLabel() +
        '. Automated 9:00am send still posts scheduled project ' +
        ((config.schedule && config.schedule.projectKey) || config.defaultProjectKey) +
        '.',
    );
    updatePageHeading();
    updateScheduleCard();
  }

  function fillProjectSelect(projects, preferredKey) {
    const $select = $('#projectKeyInput');
    const current = (preferredKey || projectKey() || config.defaultProjectKey).toUpperCase();
    projectNames = {};
    if (!projects || !projects.length) {
      $select.html('<option value="' + current + '">' + current + '</option>');
      $select.val(current);
      updatePostButtonLabel();
      return;
    }
    projects.forEach(function (project) {
      if (project.key) projectNames[project.key] = project.name || project.key;
    });
    $select.html(
      projects
        .map(function (project) {
          const label = project.key + ' — ' + (project.name || project.key);
          return (
            '<option value="' +
            $('<div>').text(project.key).html() +
            '">' +
            $('<div>').text(label).html() +
            '</option>'
          );
        })
        .join(''),
    );
    const keys = projects.map(function (p) {
      return p.key;
    });
    const selected = keys.indexOf(current) >= 0 ? current : keys[0];
    $select.val(selected);
    saveProjectKey(selected);
    updatePostButtonLabel();
  }

  function refreshProjectOptions(done) {
    api
      .listProjects()
      .done(function (projects) {
        fillProjectSelect(projects, loadSavedProjectKey());
        if (typeof done === 'function') done(projects);
      })
      .fail(function () {
        fillProjectSelect([], loadSavedProjectKey());
        if (typeof done === 'function') done([]);
      });
  }

  function showAlert(message, type) {
    const alertType = type || 'danger';
    $('#alertHost').html(
      '<div class="alert alert-' +
        alertType +
        ' alert-dismissible fade show" role="alert">' +
        $('<div>').text(message).html() +
        '<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>',
    );
  }

  function clearAlert() {
    $('#alertHost').empty();
  }

  function setPage(page) {
    $('.sidebar-nav .nav-link').removeClass('active');
    $('.sidebar-nav .nav-link[data-page="' + page + '"]').addClass('active');
    $('.page-panel').removeClass('active');
    $('#page-' + page).addClass('active');
    updatePageHeading(page);
    closeSidebar();

    if (page === 'standup') loadStandup();
    if (page === 'projects') loadProjects();
    if (page === 'issues') loadIssues();
    if (page === 'settings') fillSettingsForm();
  }

  function openSidebar() {
    $('#appSidebar').addClass('open');
    $('#sidebarBackdrop').addClass('show');
  }

  function closeSidebar() {
    $('#appSidebar').removeClass('open');
    $('#sidebarBackdrop').removeClass('show');
  }

  function renderStats(counts) {
    const c = counts || { blocked: 0, in_progress: 0, todo: 0, done: 0 };
    $('#standupStats').html(
      [
        ['Blocked', c.blocked, 'stat-blocked'],
        ['In Progress', c.in_progress, 'stat-progress'],
        ['To Do', c.todo, 'stat-todo'],
        ['Done', c.done, 'stat-done'],
      ]
        .map(function (item) {
          return (
            '<div class="col-6 col-xl-3">' +
            '<div class="stat-widget ' +
            item[2] +
            '"><div class="label">' +
            item[0] +
            '</div><div class="value">' +
            item[1] +
            '</div></div></div>'
          );
        })
        .join(''),
    );
  }

  function renderGroup(title, items) {
    const list =
      !items || !items.length
        ? '<li class="text-muted">No items</li>'
        : items
            .map(function (issue) {
              return (
                '<li><a href="' +
                (issue.url || '#') +
                '" target="_blank" rel="noreferrer">' +
                '<strong>' +
                $('<div>').text(issue.key || '').html() +
                '</strong>' +
                '<span>' +
                $('<div>').text(issue.summary || '').html() +
                '</span>' +
                '<small>' +
                $('<div>')
                  .text((issue.assignee || 'Unassigned') + ' · ' + (issue.status || '—'))
                  .html() +
                '</small></a></li>'
              );
            })
            .join('');

    return (
      '<div class="col-12 col-md-6">' +
      '<div class="border rounded-3 p-3 h-100 bg-white">' +
      '<div class="d-flex justify-content-between align-items-center mb-2">' +
      '<h6 class="mb-0">' +
      title +
      '</h6><span class="badge text-bg-light">' +
      (items ? items.length : 0) +
      '</span></div>' +
      '<ul class="group-list">' +
      list +
      '</ul></div></div>'
    );
  }

  function loadStandup() {
    clearAlert();
    const key = projectKey();
    $('#btnLoadStandup, #btnPostStandup, #btnRefreshHeader').prop('disabled', true);
    api
      .getStandup(key)
      .done(function (data) {
        renderStats(data.counts);
        $('#standupGroups').html(
          renderGroup('Blocked', data.blocked) +
            renderGroup('In Progress', data.in_progress) +
            renderGroup('To Do', data.todo) +
            renderGroup('Done', data.done),
        );
        $('#standupPreview').text(data.text || '');
      })
      .fail(function (xhr) {
        const msg =
          (xhr.responseJSON && xhr.responseJSON.error) ||
          xhr.statusText ||
          'Failed to load standup';
        showAlert(msg);
      })
      .always(function () {
        $('#btnLoadStandup, #btnPostStandup, #btnRefreshHeader').prop('disabled', false);
      });
  }

  function postStandup() {
    clearAlert();
    const key = projectKey();
    if (!key) {
      showAlert('Select a project before posting to Slack.');
      return;
    }
    const confirmed = window.confirm(
      'Post standup for project ' + key + ' to Slack?',
    );
    if (!confirmed) return;

    $('#btnPostStandup').prop('disabled', true).text('Posting ' + key + '…');
    api
      .postStandup(key)
      .done(function (data) {
        renderStats(data.counts);
        $('#standupPreview').text(data.text || '');
        showAlert(
          'Posted project ' +
            (data.projectKey || key) +
            ' to Slack (' +
            (data.channel || 'channel') +
            ').',
          'success',
        );
      })
      .fail(function (xhr) {
        const msg =
          (xhr.responseJSON && xhr.responseJSON.error) ||
          xhr.statusText ||
          'Failed to post standup';
        showAlert(msg);
      })
      .always(function () {
        $('#btnPostStandup').prop('disabled', false);
        updatePostButtonLabel();
      });
  }

  function loadProjects() {
    clearAlert();
    $('#projectsGrid').html(
      '<div class="col-12 text-muted">Loading projects…</div>',
    );
    api
      .listProjects()
      .done(function (projects) {
        if (!projects || !projects.length) {
          $('#projectsGrid').html(
            '<div class="col-12 text-muted">No projects returned. Check Settings credentials.</div>',
          );
          return;
        }
        fillProjectSelect(projects, projectKey());
        const current = projectKey();
        $('#projectsGrid').html(
          projects
            .map(function (project) {
              const active = project.key === current ? ' active' : '';
              return (
                '<div class="col-12 col-md-6 col-xl-4">' +
                '<div class="project-tile' +
                active +
                '" data-key="' +
                $('<div>').text(project.key).html() +
                '">' +
                '<div class="key">' +
                $('<div>').text(project.key).html() +
                '</div>' +
                '<div class="fw-semibold mt-1">' +
                $('<div>').text(project.name).html() +
                '</div>' +
                '<div class="text-muted small mt-1">' +
                $('<div>').text(project.style || 'classic').html() +
                '</div></div></div>'
              );
            })
            .join(''),
        );
      })
      .fail(function (xhr) {
        const msg =
          (xhr.responseJSON && xhr.responseJSON.error) ||
          xhr.statusText ||
          'Failed to load projects';
        showAlert(msg);
        $('#projectsGrid').html('<div class="col-12 text-muted">Unable to load projects.</div>');
      });
  }

  function loadIssues() {
    clearAlert();
    const key = projectKey();
    $('#issuesSubtitle').text('Project ' + key);
    $('#issuesBody').html(
      '<tr><td colspan="5" class="text-muted text-center py-4">Loading…</td></tr>',
    );
    api
      .listIssues(key)
      .done(function (data) {
        const issues = data.issues || [];
        $('#issuesSubtitle').text(
          'Project ' + key + ' · ' + (data.total || issues.length) + ' issues',
        );
        if (!issues.length) {
          $('#issuesBody').html(
            '<tr><td colspan="5" class="text-muted text-center py-4">No issues found.</td></tr>',
          );
          return;
        }
        $('#issuesBody').html(
          issues
            .map(function (issue) {
              return (
                '<tr>' +
                '<td><a href="' +
                (issue.url || '#') +
                '" target="_blank" rel="noreferrer">' +
                $('<div>').text(issue.key).html() +
                '</a></td>' +
                '<td>' +
                $('<div>').text(issue.summary || '').html() +
                '</td>' +
                '<td><span class="badge text-bg-light">' +
                $('<div>').text(issue.status || '—').html() +
                '</span></td>' +
                '<td>' +
                $('<div>').text(issue.assignee || 'Unassigned').html() +
                '</td>' +
                '<td>' +
                $('<div>').text(issue.priority || '—').html() +
                '</td></tr>'
              );
            })
            .join(''),
        );
      })
      .fail(function (xhr) {
        const msg =
          (xhr.responseJSON && xhr.responseJSON.error) ||
          xhr.statusText ||
          'Failed to load issues';
        showAlert(msg);
        $('#issuesBody').html(
          '<tr><td colspan="5" class="text-muted text-center py-4">Unable to load issues.</td></tr>',
        );
      });
  }

  function fillSettingsForm() {
    const creds = api.getCredentials();
    $('#jiraEmail').val(creds.email || '');
    $('#jiraToken').val(creds.token || '');
    $('#jiraBaseUrl').val(creds.baseUrl || config.defaultBaseUrl);
    $('#apiBaseLabel').text(config.apiBaseUrl);
  }

  function checkHealth() {
    api
      .health()
      .done(function () {
        $('#apiDot').removeClass('bad').addClass('ok');
        $('#apiStatus').text('API online');
      })
      .fail(function () {
        $('#apiDot').removeClass('ok').addClass('bad');
        $('#apiStatus').text('API offline');
      });
  }

  function refreshActivePage() {
    const page = $('.sidebar-nav .nav-link.active').data('page') || 'standup';
    if (page === 'standup') loadStandup();
    if (page === 'projects') loadProjects();
    if (page === 'issues') loadIssues();
  }

  $(function () {
    fillSettingsForm();
    checkHealth();
    updatePostButtonLabel();
    updateScheduleCard();

    refreshProjectOptions(function () {
      setPage('standup');
    });

    $('.sidebar-nav').on('click', '.nav-link', function (e) {
      e.preventDefault();
      setPage($(this).data('page'));
    });

    $('#sidebarToggle').on('click', openSidebar);
    $('#sidebarBackdrop').on('click', closeSidebar);

    $('#btnLoadStandup, #btnRefreshHeader').on('click', function () {
      refreshActivePage();
    });
    $('#btnPostStandup').on('click', postStandup);
    $('#btnLoadProjects').on('click', loadProjects);
    $('#btnLoadIssues').on('click', loadIssues);

    $('#projectsGrid').on('click', '.project-tile', function () {
      const key = String($(this).data('key') || '').toUpperCase();
      $('#projectKeyInput').val(key);
      saveProjectKey(key);
      updatePostButtonLabel();
      setPage('standup');
    });

    $('#credentialsForm').on('submit', function (e) {
      e.preventDefault();
      api.saveCredentials({
        email: $('#jiraEmail').val().trim(),
        token: $('#jiraToken').val().trim(),
        baseUrl: $('#jiraBaseUrl').val().trim() || config.defaultBaseUrl,
      });
      showAlert('Credentials saved in this browser.', 'success');
      refreshProjectOptions();
    });

    $('#btnClearCreds').on('click', function () {
      api.clearCredentials();
      fillSettingsForm();
      showAlert('Saved credentials cleared.', 'secondary');
    });

    $('#projectKeyInput').on('change', function () {
      const key = projectKey();
      saveProjectKey(key);
      updatePostButtonLabel();
      const page = $('.sidebar-nav .nav-link.active').data('page') || 'standup';
      if (page === 'standup') loadStandup();
      if (page === 'issues') loadIssues();
    });
  });
})(window, jQuery);
