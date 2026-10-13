// Liquid glass nav: sliding indicator + cursor-following highlight
(function () {
  var nav = document.querySelector(".glass-nav");
  if (!nav) return;

  var list = nav.querySelector("ul");
  var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
  var current = nav.querySelector('a[aria-current="page"]') || links[0];

  var indicator = document.createElement("span");
  indicator.className = "nav-indicator";
  indicator.setAttribute("aria-hidden", "true");
  list.insertBefore(indicator, list.firstChild);

  function moveTo(link) {
    if (!link) return;
    var listBox = list.getBoundingClientRect();
    var box = link.getBoundingClientRect();
    indicator.style.width = box.width + "px";
    indicator.style.transform = "translateX(" + (box.left - listBox.left) + "px)";
    indicator.classList.add("is-ready");
  }

  links.forEach(function (link) {
    link.addEventListener("mouseenter", function () { moveTo(link); });
    link.addEventListener("focus", function () { moveTo(link); });
  });

  nav.addEventListener("mouseleave", function () { moveTo(current); });
  list.addEventListener("focusout", function (e) {
    if (!list.contains(e.relatedTarget)) moveTo(current);
  });

  nav.addEventListener("mousemove", function (e) {
    var box = nav.getBoundingClientRect();
    nav.style.setProperty("--mx", e.clientX - box.left + "px");
    nav.style.setProperty("--my", e.clientY - box.top + "px");
  });

  window.addEventListener("resize", function () { moveTo(current); });

  // wait for web fonts so measurements are right
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { moveTo(current); });
  }
  moveTo(current);
})();

// Background music: tombol play/pause, ingat status dan posisi lagu antar halaman
(function () {
  var SRC = "Reality_Club_-_A_Sorrowful_Reunion_(mp3.pm).mp3"; // taruh file lagu dengan nama ini di folder yang sama
  var TITLE = "A Sorrowful Reunion - Reality Club";
  var VOLUME = 0.4;

  var audio = new Audio(SRC);
  audio.loop = true;
  audio.volume = VOLUME;
  audio.preload = "auto";

  function read(key) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { sessionStorage.setItem(key, value); } catch (e) {}
  }

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "bgm-toggle";
  btn.setAttribute("aria-pressed", "false");
  btn.setAttribute("aria-label", "Putar musik latar: " + TITLE);
  btn.innerHTML =
    '<span class="bgm-eq" aria-hidden="true"><i></i><i></i><i></i></span>' +
    '<span class="bgm-label"></span>';
  var label = btn.querySelector(".bgm-label");
  label.textContent = TITLE;
  document.body.appendChild(btn);

  function setUi(playing) {
    btn.classList.toggle("is-playing", playing);
    btn.setAttribute("aria-pressed", playing ? "true" : "false");
    btn.setAttribute("aria-label", (playing ? "Jeda musik latar: " : "Putar musik latar: ") + TITLE);
  }

  function play() {
    var p = audio.play();
    if (p && p.then) {
      return p.then(function () {
        write("bgm-on", "1");
        setUi(true);
        return true;
      }).catch(function () {
        setUi(false);
        return false;
      });
    }
    write("bgm-on", "1");
    setUi(true);
    return Promise.resolve(true);
  }

  function pause() {
    audio.pause();
    write("bgm-on", "0");
    setUi(false);
  }

  btn.addEventListener("click", function () {
    if (audio.paused) play(); else pause();
  });

  audio.addEventListener("error", function () {
    setUi(false);
    label.textContent = "File bgm.mp3 belum ada di folder";
  });

  // lanjut dari posisi terakhir di halaman sebelumnya
  var saved = parseFloat(read("bgm-time"));
  if (!isNaN(saved)) {
    audio.addEventListener("loadedmetadata", function () {
      if (saved < audio.duration) audio.currentTime = saved;
    }, { once: true });
  }

  window.addEventListener("pagehide", function () {
    write("bgm-time", String(audio.currentTime || 0));
  });

  // browser memblokir autoplay: kalau tadi musik nyala, lanjutkan di interaksi pertama
  if (read("bgm-on") === "1") {
    play().then(function (ok) {
      if (ok) return;
      function resume() {
        document.removeEventListener("pointerdown", resume);
        document.removeEventListener("keydown", resume);
        if (read("bgm-on") === "1" && audio.paused) play();
      }
      document.addEventListener("pointerdown", resume);
      document.addEventListener("keydown", resume);
    });
  }
})();
