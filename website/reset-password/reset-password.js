(function () {
  var SUPABASE_URL = "https://ciuojjrpsvjhpxdozhwy.supabase.co";
  var PUBLISHABLE_KEY = "sb_publishable_CeKDouinnVEvtAO7xPIVcA_Mky3SvPT";
  var MIN_PASSWORD_LENGTH = 6;

  var els = {
    loading: document.getElementById("state-loading"),
    form: document.getElementById("state-form"),
    notice: document.getElementById("state-notice"),
    noticeBody: document.getElementById("notice-body"),
    success: document.getElementById("state-success"),
    password: document.getElementById("password"),
    passwordConfirm: document.getElementById("password-confirm"),
    error: document.getElementById("form-error"),
    submit: document.getElementById("submit"),
  };

  function show(state) {
    els.loading.hidden = state !== "loading";
    els.form.hidden = state !== "form";
    els.notice.hidden = state !== "notice";
    els.success.hidden = state !== "success";
  }

  function showNotice(message) {
    if (message) els.noticeBody.textContent = message;
    show("notice");
  }

  // An expired or already-used link comes back as an error in the URL hash.
  function hashError() {
    var hash = window.location.hash || "";
    if (!hash) return null;
    var params = new URLSearchParams(hash.replace(/^#/, ""));
    if (!params.get("error") && !params.get("error_description")) return null;
    var description = params.get("error_description");
    return description
      ? description.replace(/\+/g, " ")
      : "Your reset link is invalid or has expired.";
  }

  if (!window.supabase || !window.supabase.createClient) {
    showNotice(
      "We couldn't load the password reset tools. Check your connection and reopen the link from your email."
    );
    return;
  }

  var client = window.supabase.createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: {
      detectSessionInUrl: true,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  var hasSession = false;
  var settled = false;

  function enableForm() {
    if (settled) return;
    settled = true;
    hasSession = true;
    show("form");
    els.password.focus();
  }

  client.auth.onAuthStateChange(function (event, session) {
    if (event === "PASSWORD_RECOVERY" || session) {
      enableForm();
    }
  });

  // Resolve the initial state once the SDK has had a chance to parse the URL hash.
  window.addEventListener("load", function () {
    var error = hashError();
    if (error) {
      settled = true;
      showNotice(error);
      return;
    }

    client.auth.getSession().then(function (result) {
      if (settled) return;
      if (result.data && result.data.session) {
        enableForm();
      } else {
        settled = true;
        showNotice();
      }
    });
  });

  function setError(message) {
    if (message) {
      els.error.textContent = message;
      els.error.hidden = false;
    } else {
      els.error.textContent = "";
      els.error.hidden = true;
    }
  }

  els.form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!hasSession) return;
    setError("");

    var password = els.password.value;
    var confirm = els.passwordConfirm.value;

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("Password must be at least " + MIN_PASSWORD_LENGTH + " characters.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords don't match.");
      return;
    }

    els.submit.disabled = true;
    els.submit.textContent = "Updating…";

    client.auth
      .updateUser({ password: password })
      .then(function (result) {
        if (result.error) {
          setError(result.error.message || "Couldn't update your password.");
          els.submit.disabled = false;
          els.submit.textContent = "Update password";
          return;
        }
        // Clear the in-memory recovery session and show success.
        client.auth.signOut();
        show("success");
      })
      .catch(function () {
        setError("Something went wrong. Please try again.");
        els.submit.disabled = false;
        els.submit.textContent = "Update password";
      });
  });
})();
