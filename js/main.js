/* ことばの灯台（制作サンプル）— main.js
   決まり：フォーム・予約・申し込みはどこにも送らない・保存しない（localStorage なども使わない）。
   動きは prefers-reduced-motion のときは止める。JS が動かなくても読める。 */
(function () {
  'use strict';
  var d = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 通知（サンプルのため…） ---------- */
  var toast = d.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  d.body.appendChild(toast);
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-shown'); }, 3600);
  }
  var SAMPLE_MSG = {
    line: 'サンプルのため、LINE には移動しません（実際の案件では公式アカウントの友だち追加につなぎます）',
    sns: 'サンプルのため、SNS には移動しません',
    tel: 'サンプルのため、電話はかかりません',
    mail: 'サンプルのため、メールは開きません',
    calendar: 'サンプルのため、予約カレンダーは開きません'
  };
  d.addEventListener('click', function (e) {
    var el = e.target.closest('[data-sample]');
    if (!el) return;
    e.preventDefault();
    showToast(SAMPLE_MSG[el.getAttribute('data-sample')] || 'サンプルのため、この操作は動きません');
  });

  /* ---------- メニュー（スマホ） ---------- */
  var toggle = d.querySelector('.menu-toggle');
  var nav = d.getElementById('site-nav');
  if (toggle && nav) {
    function setMenu(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.querySelector('.menu-toggle__label').textContent = open ? '閉じる' : 'メニュー';
      nav.classList.toggle('is-open', open);
      d.body.classList.toggle('menu-open', open);
      if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
    }
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (ev) { if (ev.matches) setMenu(false); });
  }

  /* ---------- 今いるページをメニューに印 ---------- */
  var here = location.pathname.split('/').pop() || 'index.html';
  d.querySelectorAll('.site-nav a, .site-footer__nav a').forEach(function (a) {
    var href = a.getAttribute('href').split('#')[0];
    if (href === here) a.setAttribute('aria-current', 'page');
  });

  /* ---------- 1文字ずつ浮かぶ見出し ---------- */
  if (!reduce) {
    d.querySelectorAll('.split').forEach(function (el) {
      var i = 0;
      var original = el.textContent;
      el.setAttribute('aria-label', original.replace(/\s+/g, ''));
      el.querySelectorAll('.line').forEach(function (line) {
        var text = line.textContent;
        line.textContent = '';
        line.setAttribute('aria-hidden', 'true');
        Array.prototype.forEach.call(text, function (ch) {
          var s = d.createElement('span');
          s.className = 'char';
          s.textContent = ch;
          s.style.setProperty('--i', i++);
          line.appendChild(s);
        });
      });
    });
  }

  /* ---------- スクロールで現れる（animation-timeline 未対応の保険）・線が伸びる・切り抜き ---------- */
  var targets = d.querySelectorAll('.reveal, .draw, .clip-reveal--scroll');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 流れる帯：止めるボタン ---------- */
  d.querySelectorAll('.marquee').forEach(function (m) {
    var track = m.querySelector('.marquee__track');
    var btn = m.querySelector('.marquee__pause');
    if (!track || !btn) return;
    if (reduce) { btn.hidden = true; return; }
    btn.addEventListener('click', function () {
      var paused = track.classList.toggle('is-paused');
      btn.textContent = paused ? '動かす' : '止める';
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    });
  });

  /* ---------- 電話とメールの「どちらか必須」（ボスの決定） ---------- */
  function checkEither(fields, errEl) {
    var filled = fields.some(function (el) { return el && el.value.trim() !== ''; });
    fields.forEach(function (el) { if (el) { if (filled) el.removeAttribute('aria-invalid'); else el.setAttribute('aria-invalid', 'true'); } });
    if (errEl) errEl.textContent = filled ? '' : '電話番号かメールアドレスの、どちらか一方を入力してください。';
    if (!filled && fields[0]) fields[0].focus();
    return filled;
  }

  /* ---------- フォーム（送信しない） ---------- */
  d.querySelectorAll('form[data-sample-form]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var either = form.querySelector('[data-either]');
      if (either) {
        var names = either.getAttribute('data-either').split(',');
        var els = names.map(function (n) { return either.querySelector('[name="' + n + '"]'); });
        if (!checkEither(els, either.querySelector('.field-error'))) return;
      }
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var msg = form.getAttribute('data-sample-form') || 'サンプルのため送信されません。入力内容はどこにも送られず、保存もされません。';
      if (status) status.textContent = msg;
      showToast('サンプルのため送信されません');
      var conf = form.getAttribute('data-confirm-target');
      if (conf) {
        var target = d.getElementById(conf);
        if (target) { fillConfirm(form, target); target.hidden = false; target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
      }
    });
  });

  /* ---------- 申し込みの見本：最終確認画面に入力を写す ---------- */
  var PLANS = {
    session: { name: '個別セッション「伝え方の整理」', amount: '90分 × 1回（オンラインまたは対面）', price: '16,500円（税込）', deliver: 'お申し込みの受付から7日以内に、ご希望の日時を調整してご案内します', period: 'お申し込みはいつでも受け付けています（日時は空きしだい）', cancel: '日時の2日前（48時間前）までのご連絡は無料で変更・取り消しできます。それ以降は料金の50%、当日は全額をいただきます' },
    course: { name: '少人数講座「自分の仕事を、ひとことで言える講座」', amount: '全4回（各2時間・オンライン・6名まで）＋事前の質問票＋終了後の資料', price: '66,000円（税込）', deliver: '第1回の開講日から（次回の開講日はお申し込み後にご案内する見本です）', period: '開講日の7日前まで。定員になりしだい締め切ります', cancel: '開講日の7日前までは全額をお返しします。6日前〜前日は料金の50%、開講後は原則としてお返しできません（別の回への振り替えはご相談ください）' },
    accompany: { name: '伴走プラン「3か月の伴走」', amount: 'セッション 月2回 × 3か月（計6回・各60分）＋期間中のメッセージ相談', price: '99,000円（税込）', deliver: '初回セッションの日から3か月間', period: 'お申し込みはいつでも受け付けています（同時にお受けできる人数に上限があります）', cancel: '初回セッションの前日までは全額をお返しします。開始後は、残りの回数ぶんの料金から事務手数料（3,300円）を引いてお返しします' }
  };
  function fillConfirm(form, target) {
    var plan = PLANS[(form.querySelector('[name="plan"]:checked') || {}).value] || PLANS.session;
    var pay = (form.querySelector('[name="pay"]:checked') || {}).value || '銀行振込';
    var set = function (key, val) { var el = target.querySelector('[data-confirm="' + key + '"]'); if (el) el.textContent = val; };
    set('plan', plan.name);
    set('amount', plan.amount);
    set('price', plan.price);
    set('pay', pay === 'card' ? 'クレジットカード（見本。決済画面には進みません）' : '銀行振込（お申し込みから7日以内。振込手数料はお客様のご負担です）');
    set('deliver', plan.deliver);
    set('period', plan.period);
    set('cancel', plan.cancel);
    set('total', plan.price);
    var name = form.querySelector('[name="name"]');
    set('name', name && name.value ? name.value : '（お名前）');
    var mail = form.querySelector('[name="email"]');
    var tel = form.querySelector('[name="tel"]');
    var contact = [mail && mail.value ? 'メール：' + mail.value : '', tel && tel.value ? '電話：' + tel.value : ''].filter(Boolean).join('／');
    set('email', contact || '（ご連絡先）');
  }
  d.querySelectorAll('[data-confirm-submit]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var agree = d.getElementById(btn.getAttribute('data-confirm-submit'));
      if (agree && !agree.checked) { showToast('確認の項目にチェックを入れてください（見本）'); agree.focus(); return; }
      showToast('サンプルのため、お申し込みは送信されません');
      var done = d.getElementById('apply-done');
      if (done) { done.hidden = false; done.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
    });
  });

  /* ---------- 無料相談の予約の見本（送らない・保存しない） ---------- */
  var booking = d.querySelector('.booking');
  if (booking) {
    var state = { kind: '', date: null, time: '', name: '' };
    var panels = booking.querySelectorAll('.booking__panel');
    var progress = booking.querySelectorAll('.booking__progress li');
    var label = booking.querySelector('.booking__progress-label');
    var STEP_LABEL = ['1 / 5　相談の方法', '2 / 5　日にち', '3 / 5　時間', '4 / 5　お名前', '5 / 5　確認', '完了'];
    var step = 0;
    function show(n, noFocus) {
      step = n;
      panels.forEach(function (p, i) { p.hidden = i !== n; });
      progress.forEach(function (li, i) { li.classList.toggle('is-done', i < n); li.classList.toggle('is-current', i === n); });
      if (label) label.textContent = STEP_LABEL[n] || '';
      var h = panels[n] && panels[n].querySelector('h3');
      if (h && !noFocus) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
    // 日にち：今日から14日ぶんの見本。日曜はお休み。空きは日付から決まる見本の計算（本物の空きではない）
    var dates = booking.querySelector('.booking__dates');
    var WEEK = ['日', '月', '火', '水', '木', '金', '土'];
    if (dates) {
      var today = new Date();
      for (var i = 2; i < 16; i++) {
        var dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        var b = d.createElement('button');
        b.type = 'button';
        b.innerHTML = '<span class="num">' + (dt.getMonth() + 1) + '/' + dt.getDate() + '</span><small>' + WEEK[dt.getDay()] + '</small>';
        b.setAttribute('aria-label', (dt.getMonth() + 1) + '月' + dt.getDate() + '日（' + WEEK[dt.getDay()] + '）');
        if (dt.getDay() === 0) { b.disabled = true; b.setAttribute('aria-label', b.getAttribute('aria-label') + ' お休み'); }
        b.dataset.date = dt.getTime();
        b.addEventListener('click', function () {
          dates.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          this.setAttribute('aria-pressed', 'true');
          state.date = new Date(Number(this.dataset.date));
          booking.querySelector('[data-next="2"]').disabled = false;
        });
        dates.appendChild(b);
      }
    }
    var slots = booking.querySelector('.booking__slots');
    function buildSlots() {
      if (!slots) return;
      slots.innerHTML = '';
      var TIMES = ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '19:00', '20:00'];
      var seed = state.date ? state.date.getDate() : 1;
      TIMES.forEach(function (t, i) {
        var b = d.createElement('button');
        b.type = 'button';
        b.textContent = t;
        // 見本：日にちから決まる「埋まっている時間」
        if ((seed + i) % 4 === 0) { b.disabled = true; b.setAttribute('aria-label', t + ' 埋まっています（見本）'); }
        b.addEventListener('click', function () {
          slots.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          this.setAttribute('aria-pressed', 'true');
          state.time = t;
          booking.querySelector('[data-next="3"]').disabled = false;
        });
        slots.appendChild(b);
      });
    }
    booking.querySelectorAll('[name="booking-kind"]').forEach(function (r) {
      r.addEventListener('change', function () { state.kind = r.value; booking.querySelector('[data-next="1"]').disabled = false; });
    });
    booking.addEventListener('click', function (e) {
      var next = e.target.closest('[data-next]');
      var back = e.target.closest('[data-back]');
      if (next) {
        var n = Number(next.getAttribute('data-next'));
        if (n === 2) buildSlots();
        if (n === 4) {
          var nameEl = booking.querySelector('[name="booking-name"]');
          if (nameEl && !nameEl.value.trim()) { nameEl.reportValidity(); return; }
          if (!checkEither([booking.querySelector('[name="booking-tel"]'), booking.querySelector('[name="booking-contact"]')], d.getElementById('booking-contact-error'))) return;
          state.name = nameEl ? nameEl.value.trim() : '';
          var dtText = state.date ? (state.date.getMonth() + 1) + '月' + state.date.getDate() + '日（' + WEEK[state.date.getDay()] + '）' : '';
          booking.querySelector('[data-sum="kind"]').textContent = state.kind === 'online' ? 'オンライン（ビデオ通話）' : '対面（〇〇市の貸し会議室・架空）';
          booking.querySelector('[data-sum="date"]').textContent = dtText + ' ' + state.time + '〜（30分）';
          booking.querySelector('[data-sum="name"]').textContent = state.name;
          var bt = booking.querySelector('[name="booking-tel"]').value.trim(), bm = booking.querySelector('[name="booking-contact"]').value.trim();
          booking.querySelector('[data-sum="contact"]').textContent = [bm ? 'メール：' + bm : '', bt ? '電話：' + bt : ''].filter(Boolean).join('／');
        }
        if (n === 5) { showToast('サンプルのため予約されません'); }
        show(n);
      }
      if (back) show(Number(back.getAttribute('data-back')));
    });
    show(0, true); // 開いたときは、操作の位置を動かさない
  }

  /* ---------- 年（フッター） ---------- */
  d.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
