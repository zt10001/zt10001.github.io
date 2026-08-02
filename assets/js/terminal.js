// Interactive shell for the home page. The filesystem and prompt strings are
// injected by _includes/terminal.html as JSON script tags.
(function () {
  "use strict";

  var fsEl = document.getElementById("terminal-fs");
  var metaEl = document.getElementById("terminal-meta");
  var input = document.getElementById("terminal-input");
  var historyEl = document.getElementById("history");
  var promptPrefix = document.getElementById("prompt-prefix");
  var titlebarText = document.querySelector(".titlebar-text");
  var frame = document.querySelector(".window-frame");

  if (!fsEl || !metaEl || !input || !historyEl) return;

  var root = { type: "dir", children: JSON.parse(fsEl.textContent) };
  var meta = JSON.parse(metaEl.textContent);
  var cwd = []; // path segments below ~

  // -------------------- helpers -------------------- //

  function esc(str) {
    var d = document.createElement("div");
    d.textContent = str == null ? "" : String(str);
    return d.innerHTML;
  }

  function displayPath() {
    return cwd.length ? "~/" + cwd.join("/") : "~";
  }

  function promptHtml() {
    return (
      '<span class="user">' + esc(meta.user) + "</span>@" +
      '<span class="host">' + esc(meta.host) + "</span>:" +
      esc(displayPath()) + "$ "
    );
  }

  function updatePrompt() {
    promptPrefix.innerHTML = promptHtml();
    if (titlebarText) {
      titlebarText.textContent = meta.user + "@" + meta.host + ": " + displayPath();
    }
  }

  // Resolve a path string to { node, segments } or null.
  function resolve(path) {
    var parts;
    if (path === undefined || path === null || path === "") {
      parts = cwd.slice();
    } else if (path === "~" || path.indexOf("~/") === 0) {
      parts = path.slice(1).split("/").filter(Boolean);
    } else if (path.charAt(0) === "/") {
      parts = path.split("/").filter(Boolean);
    } else {
      parts = cwd.concat(path.split("/").filter(Boolean));
    }

    var segments = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] === "..") segments.pop();
      else if (parts[i] !== ".") segments.push(parts[i]);
    }

    var node = root;
    for (var j = 0; j < segments.length; j++) {
      if (node && node.type === "dir" && node.children && segments[j] in node.children) {
        node = node.children[segments[j]];
      } else {
        return null;
      }
    }
    return { node: node, segments: segments };
  }

  function entryHtml(name, entry) {
    if (entry.type === "dir") return '<span class="dir">' + esc(name) + "/</span>";
    if (entry.type === "link") return '<span class="link">' + esc(name) + "</span>";
    if (entry.hidden) return '<span class="hidden">' + esc(name) + "</span>";
    return '<span class="file">' + esc(name) + "</span>";
  }

  function err(msg) {
    return '<span class="err">' + msg + "</span>";
  }

  // -------------------- commands -------------------- //

  var commands = {
    help: function () {
      return (
        "available commands:\n\n" +
        "  help       show this message\n" +
        "  whoami     who runs this site\n" +
        "  ls [-a]    list files\n" +
        "  cd &lt;dir&gt;   change directory\n" +
        "  cat &lt;file&gt; read a file\n" +
        "  pwd        print working directory\n" +
        "  open &lt;f&gt;   open a link in a new tab\n" +
        "  clear      clear the terminal\n" +
        "  date       current date\n" +
        "  echo       echo text\n" +
        "  uname -a   system info\n\n" +
        '<span class="tab-hint">tab completes commands and paths; up/down walks history</span>'
      );
    },

    whoami: function () {
      return esc(meta.whoami) + "\n" + esc(meta.title) + "\n" + esc(meta.url);
    },

    pwd: function () {
      return esc(displayPath());
    },

    ls: function (args) {
      var showHidden = /^-[al]{1,2}$/.test(args || "");
      var target = args && args.charAt(0) !== "-" ? args : null;
      var r = resolve(target);

      if (!r) return err("ls: " + esc(target) + ": No such file or directory");
      if (r.node.type !== "dir") return entryHtml(target, r.node);

      var names = Object.keys(r.node.children || {});
      if (!showHidden) {
        names = names.filter(function (n) {
          return n.charAt(0) !== "." && !r.node.children[n].hidden;
        });
      }
      if (!names.length) return '<span class="hidden">(empty)</span>';

      return names
        .map(function (n) {
          return entryHtml(n, r.node.children[n]);
        })
        .join("  ");
    },

    cd: function (args) {
      if (!args || args === "~") {
        cwd = [];
        updatePrompt();
        return "";
      }
      var r = resolve(args);
      if (!r) return err("cd: " + esc(args) + ": No such file or directory");
      if (r.node.type !== "dir") return err("cd: " + esc(args) + ": Not a directory");
      cwd = r.segments;
      updatePrompt();
      return "";
    },

    cat: function (args) {
      if (!args) return err("cat: missing file operand");
      var r = resolve(args);
      if (!r) return err("cat: " + esc(args) + ": No such file or directory");
      if (r.node.type === "dir") return err("cat: " + esc(args) + ": Is a directory");
      if (r.node.type === "link") {
        return (
          '<a href="' + esc(r.node.url) + '">' + esc(r.node.url) + "</a>" +
          (r.node.desc ? "\n" + esc(r.node.desc) : "")
        );
      }
      return esc(r.node.content);
    },

    open: function (args) {
      if (!args) return err("open: missing file operand");
      var r = resolve(args);
      if (!r) return err("open: " + esc(args) + ": No such file or directory");
      if (r.node.type === "link" && r.node.url) {
        window.open(r.node.url, "_blank", "noopener");
        return "opening " + esc(r.node.url) + "...";
      }
      return err("open: " + esc(args) + ": not a link");
    },

    date: function () {
      return esc(new Date().toString());
    },

    echo: function (args) {
      return esc(args || "");
    },

    uname: function (args) {
      return args === "-a"
        ? esc(meta.host + " 1.0.0 #1 jekyll static web browser")
        : esc(meta.host);
    },

    clear: function () {
      return "__CLEAR__";
    }
  };

  // -------------------- output -------------------- //

  function addLine(html) {
    var el = document.createElement("div");
    el.className = "interactive-line";
    el.innerHTML = html;
    historyEl.appendChild(el);
  }

  function addOutput(html) {
    var el = document.createElement("div");
    el.className = "interactive-output";
    el.innerHTML = html;
    historyEl.appendChild(el);
  }

  function scrollBottom() {
    requestAnimationFrame(function () {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
  }

  // -------------------- completion & history -------------------- //

  function getCompletions(partial) {
    var parts = partial.split(/\s+/);
    var cmd = parts[0];

    if (parts.length === 1) {
      return Object.keys(commands)
        .filter(function (c) {
          return c.indexOf(cmd) === 0;
        })
        .map(function (c) {
          return c + " ";
        });
    }

    if (["cd", "cat", "ls", "open"].indexOf(cmd) === -1) return [];

    var arg = parts.slice(1).join(" ");
    var lastSlash = arg.lastIndexOf("/");
    var dirPath = lastSlash >= 0 ? arg.slice(0, lastSlash) || "/" : "";
    var prefix = lastSlash >= 0 ? arg.slice(lastSlash + 1) : arg;

    var r = resolve(dirPath);
    if (!r || r.node.type !== "dir") return [];

    return Object.keys(r.node.children || {})
      .filter(function (n) {
        return n.charAt(0) !== "." && n.indexOf(prefix) === 0;
      })
      .map(function (n) {
        var base = lastSlash >= 0 ? arg.slice(0, lastSlash + 1) : "";
        var suffix = r.node.children[n].type === "dir" ? "/" : "";
        return cmd + " " + base + n + suffix;
      });
  }

  var cmdHistory = [];
  var historyIndex = -1;

  function run(raw) {
    var match = raw.match(/^(\S+)\s*(.*)$/);
    var cmd = match ? match[1].toLowerCase() : raw.toLowerCase();
    var args = match ? match[2].trim() : "";

    if (cmd === "clear") {
      historyEl.innerHTML = "";
      return null;
    }
    if (commands[cmd]) return commands[cmd](args);
    return err("-bash: " + esc(cmd) + ": command not found. try `help`");
  }

  input.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      e.preventDefault();
      var completions = getCompletions(input.value);
      if (completions.length === 1) {
        input.value = completions[0];
      } else if (completions.length > 1) {
        addLine(promptHtml() + '<span class="cmd">' + esc(input.value) + "</span>");
        addOutput(
          completions
            .map(function (c) {
              return esc(c.replace(/^\S+\s*/, "") || c);
            })
            .join("  ")
        );
        scrollBottom();
      }
      return;
    }

    if (e.key === "Enter") {
      var raw = input.value.trim();
      input.value = "";
      historyIndex = -1;

      if (!raw) {
        addLine(promptHtml());
        scrollBottom();
        return;
      }

      cmdHistory.push(raw);
      addLine(promptHtml() + '<span class="cmd">' + esc(raw) + "</span>");

      var output = run(raw);
      if (output) addOutput(output);
      scrollBottom();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!cmdHistory.length) return;
      if (historyIndex === -1) historyIndex = cmdHistory.length;
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = cmdHistory[historyIndex];
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      historyIndex = Math.min(cmdHistory.length, historyIndex + 1);
      input.value = historyIndex < cmdHistory.length ? cmdHistory[historyIndex] : "";
      if (historyIndex >= cmdHistory.length) historyIndex = -1;
    }
  });

  if (frame) {
    frame.addEventListener("click", function (e) {
      // Don't steal focus from links or text the visitor is selecting.
      if (e.target.closest("a")) return;
      if (window.getSelection && String(window.getSelection())) return;
      input.focus();
    });
  }

  updatePrompt();
})();
