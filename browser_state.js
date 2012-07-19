function getDatabase() {
  return openDatabase("browser_state", "1.0", "Browser State Exteneion Database", 1024 * 1024);
}

function initDatabase() {
  var db = getDatabase();

  db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS states');
    tx.executeSql("CREATE TABLE states(title TEXT NOT NULL, url TEXT NOT NULL UNIQUE)");
  });

  return db;
}

function getStates(cb) {
  getDatabase().readTransaction(function(tx) {
    tx.executeSql("SELECT title, url FROM states", [], function(rx,rs) {
      cb(rs);
    });
  });
}

function saveTabs() {
  chrome.windows.getAll({ "populate": true }, function(windows) {
    var urls = new Array;

    for (var window_index in windows) {
      var w = windows[window_index];
      var tabs = w.tabs;

      for (var index in tabs) {
        (function(tab) {
          var obj = {};

          if (tab.hasOwnProperty("title")) {
            obj.title = tab.title;
          }

          if (tab.hasOwnProperty("url") && /^http/.test(tab.url)) {
            obj.url = tab.url;
          }

          if ("title" in obj && "url" in obj) {
            urls.push(obj);
          }
        })(tabs[index]);
      }
    }

    if (urls.length > 0) {
      var db = initDatabase();
      var cnt = 0;

        for (var index in urls) {
          (function(url) {
            db.transaction(function(tx) {
              tx.executeSql("INSERT INTO states(title,url) VALUES(?,?)", [url.title,url.url], function() {
                showNotification("追加しました", url.url);

                cnt++;

                updateBadge(new String(cnt));

                if (urls.length === cnt) {
                  initView();
                }
              });
            });
          })(urls[index]);
        }
    } else {
      alert("登録可能なURLがありません");
    }
  });
}

function restoreTabs() {
  getStates(function(rs) {
    var rows = rs.rows;

    for (var i = 0;i < rows.length;i++) {
      var row = rows.item(i);

      chrome.tabs.create({ "url": row.url, "selected": false });
    }
  });
}

function showNotification(title,message) {
  var notify = webkitNotifications.createNotification("icon_blue.png", title, message);
  notify.onshow = function() {
    setTimeout(function() {
      notify.cancel();
    }, 2000);
  };
  notify.show();
}

function updateBadge(text) {
  chrome.browserAction.setBadgeText({ "text": text.toString() });
  chrome.browserAction.setIcon({ "path": "icon_blue.png" });
}
