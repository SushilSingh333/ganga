/* ============================================================
   GANGA COUNTY · main.js · v2 (Premium)
   ─ Preloader, custom cursor, magnetic buttons
   ─ Hero slider + intro animation sequence
   ─ Scroll-reveal, counter animation, active-section tracking
   ─ Mobile drawer, modal, scroll-to-top
   ─ Smooth anchor scroll
   ============================================================ */

(() => {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Preloader ──────────────────────────────────────────── */
  const preloader = $('#preloader');
  const plPercent = $('#plPercent');
  if (plPercent && !reduceMotion) {
    const plDur = 2400;
    const plStart = performance.now();
    const plTick = (now) => {
      const p = Math.min((now - plStart) / plDur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(eased * 99);
      plPercent.innerHTML = String(val).padStart(2, '0') + '<em>%</em>';
      if (p < 1) requestAnimationFrame(plTick);
    };
    requestAnimationFrame(plTick);
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('is-out');
      document.body.classList.add('is-anim');
    }, reduceMotion ? 200 : 2700);

    // Hero video — load YouTube iframe on desktop only, via the official IFrame API.
    // Poster stays on top (z-index:2) until YT confirms PLAYING; loops within [start..end] window.
    const heroVid = $('.hero-video[data-yt]');
    if (heroVid && window.innerWidth >= 900 && !reduceMotion) {
      const id = heroVid.dataset.yt;
      const startAt = parseInt(heroVid.dataset.start || '0', 10);
      const endAt = parseFloat(heroVid.dataset.end || '0') || Infinity;

      // Anchor element the API will replace with an iframe
      const anchorId = 'hero-yt-anchor';
      const anchor = document.createElement('div');
      anchor.id = anchorId;
      anchor.className = 'hero-yt-anchor';
      heroVid.appendChild(anchor);

      let loopTimer = null;
      const startLoopWatcher = (player) => {
        if (loopTimer) return;
        loopTimer = setInterval(() => {
          try {
            const t = player.getCurrentTime();
            if (t >= endAt) {
              player.seekTo(startAt, true);
              player.playVideo();
            }
          } catch (_) {}
        }, 400);
      };

      const initPlayer = () => {
        new YT.Player(anchorId, {
          videoId: id,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1, mute: 1, controls: 0, rel: 0,
            iv_load_policy: 3, modestbranding: 1, playsinline: 1,
            disablekb: 1, fs: 0, cc_load_policy: 0,
            start: startAt
          },
          events: {
            onReady: (e) => {
              try {
                e.target.mute();
                e.target.seekTo(startAt, true);
                e.target.playVideo();
              } catch (_) {}
            },
            onStateChange: (e) => {
              // 1 = PLAYING → fade poster + start watching for end-cap
              if (e.data === 1) {
                heroVid.classList.add('is-playing');
                startLoopWatcher(e.target);
              }
              // 0 = ENDED → restart at startAt (safety net if endAt isn't set)
              if (e.data === 0) {
                try {
                  e.target.seekTo(startAt, true);
                  e.target.playVideo();
                } catch (_) {}
              }
            }
          }
        });
      };

      // Safety net: if YT API somehow never confirms PLAYING, fade poster after 7s anyway
      setTimeout(() => heroVid.classList.add('is-playing'), 7000);

      // Load YT IFrame API once, then init
      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => { if (prev) prev(); initPlayer(); };
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const s = document.createElement('script');
          s.src = 'https://www.youtube.com/iframe_api';
          s.async = true;
          document.head.appendChild(s);
        }
      }
    }
  });

  /* ── Custom Cursor ──────────────────────────────────────── */
  const cur = $('#cur');
  const curLabel = $('.cur-label', cur);
  const isFinePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const isWideEnough = window.innerWidth > 1024;
  if (isFinePointer && isWideEnough) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let hasMoved = false;
    let raf;

    const start = (e) => {
      tx = cx = e.clientX;
      ty = cy = e.clientY;
      if (!hasMoved) {
        hasMoved = true;
        cur.classList.add('is-on');
        if (!raf) raf = requestAnimationFrame(tick);
      }
    };

    document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    document.addEventListener('mouseenter', start, { passive: true });
    document.addEventListener('mouseover', start, { passive: true, once: true });

    // Hide cursor when pointer leaves the document
    document.addEventListener('mouseleave', () => cur.classList.remove('is-on'));
    document.addEventListener('mouseenter', () => cur.classList.add('is-on'));

    const tick = () => {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      cur.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    const hoverSel = 'a, button, input, select, textarea, [data-magnet], .plot-card, .amen-card, .why-row, .press-card';
    document.addEventListener('mouseover', e => {
      const t = e.target.closest(hoverSel);
      const im = e.target.closest('[data-cursor]');
      if (im) {
        cur.classList.add('is-img');
        curLabel.textContent = im.dataset.cursor;
      } else if (t) {
        cur.classList.add('is-hover');
      }
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest('[data-cursor]')) cur.classList.remove('is-img');
      if (e.target.closest(hoverSel)) cur.classList.remove('is-hover');
    });
  } else if (cur) {
    cur.remove();
  }

  /* ── Magnetic Buttons ───────────────────────────────────── */
  if (isFinePointer && isWideEnough && !reduceMotion) {
    $$('[data-magnet]').forEach(el => {
      let raf;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
        });
      });
      el.addEventListener('mouseleave', () => {
        cancelAnimationFrame(raf);
        el.style.transition = 'transform .55s cubic-bezier(.34,1.5,.64,1)';
        el.style.transform = '';
        setTimeout(() => { el.style.transition = ''; }, 600);
      });
    });
  }

  /* ── Header Scroll State + Active Section ───────────────── */
  const header = $('#hdr');
  const upBtn = $('#goUp');
  const navLinks = $$('[data-nav]');

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 60);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  upBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const footerEl = $('.ft');
  if (footerEl) {
    const upObs = new IntersectionObserver(entries => {
      entries.forEach(en => upBtn.classList.toggle('is-on', en.isIntersecting));
    }, { threshold: 0.05 });
    upObs.observe(footerEl);
  }

  // Active section
  const sections = navLinks
    .map(l => $(l.getAttribute('href')))
    .filter(Boolean);
  if (sections.length) {
    const secObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const id = '#' + en.target.id;
          navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => secObs.observe(s));
  }

  /* ── Mobile Drawer ──────────────────────────────────────── */
  const burger = $('#burger');
  const drawer = $('#drawer');
  burger.addEventListener('click', () => {
    burger.classList.toggle('is-open');
    drawer.classList.toggle('is-open');
    document.body.style.overflow = drawer.classList.contains('is-open') ? 'hidden' : '';
  });
  $$('a', drawer).forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('is-open');
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
  }));

  /* Hero image — single static image, no slider */

  /* ── Reveal On Scroll ───────────────────────────────────── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const el = en.target;
        const sibs = Array.from(el.parentElement.children).filter(c => c.matches('[data-reveal]'));
        const idx = sibs.indexOf(el);
        el.style.transitionDelay = (Math.max(idx, 0) * 0.07) + 's';
        el.classList.add('is-in');
        revealObs.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  $$('[data-reveal]').forEach(el => revealObs.observe(el));

  /* ── Counters ───────────────────────────────────────────── */
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = parseInt(el.dataset.count, 10);
      const dur = 1800;
      const start = performance.now();
      const isPadded = el.dataset.count.startsWith('0');
      const pad = (n) => isPadded && n < 10 ? '0' + n : n;
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = pad(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.4 });
  $$('[data-count]').forEach(el => counterObs.observe(el));

  /* ── Hero parallax (subtle) ─────────────────────────────── */
  const heroRow = $('.hero-row');
  const heroPlaque = $('.hero-plaque');
  if (heroRow && !reduceMotion) {
    let last = 0;
    document.addEventListener('scroll', () => {
      const y = Math.min(window.scrollY, 800);
      if (Math.abs(y - last) < 1) return;
      last = y;
      heroRow.style.transform = `translateY(${y * 0.16}px)`;
      if (heroPlaque) heroPlaque.style.transform = `translateY(${y * 0.08}px)`;
    }, { passive: true });
  }

  /* ── Smooth Anchor Scroll ───────────────────────────────── */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const h = a.getAttribute('href');
      if (h.length <= 1) return;
      const t = document.querySelector(h);
      if (!t) return;
      e.preventDefault();
      const top = t.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── Modal ──────────────────────────────────────────────── */
  const modal = $('#leadModal');
  window.openLead = (topic) => {
    $('#modalInt').value = topic || '';
    modal.classList.add('is-on');
    document.body.style.overflow = 'hidden';
  };
  modal.addEventListener('click', e => {
    if (e.target.matches('[data-close]') || e.target.closest('[data-close]')) {
      modal.classList.remove('is-on');
      document.body.style.overflow = '';
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-on')) {
      modal.classList.remove('is-on');
      document.body.style.overflow = '';
    }
  });

  // Auto-open once per session
  setTimeout(() => {
    if (!sessionStorage.getItem('gc_modal_shown')) {
      window.openLead('Site Visit');
      sessionStorage.setItem('gc_modal_shown', '1');
    }
  }, 28000);

  /* ── Form Submission (demo) ─────────────────────────────── */
  window.sendForm = (e, form) => {
    e.preventDefault();
    const btn = form.querySelector('.cf-submit, .form-submit');
    if (!btn) return false;
    const lbl = btn.querySelector('.cf-submit-label') || btn.querySelector('span');
    const original = lbl ? lbl.textContent : '';
    if (lbl) lbl.textContent = 'Sending…';
    btn.disabled = true;
    setTimeout(() => {
      if (lbl) lbl.textContent = '✓ Sent';
      const success = form.querySelector('.cf-success');
      if (success) success.hidden = false;
      setTimeout(() => {
        form.reset();
        if (lbl) lbl.textContent = original;
        btn.disabled = false;
        if (success) success.hidden = true;
        if (modal.classList.contains('is-on')) {
          modal.classList.remove('is-on');
          document.body.style.overflow = '';
        }
      }, 2400);
    }, 900);
    return false;
  };

  /* ── Gallery: in-view stagger ───────────────────────────── */
  const galItems = $$('.gal-it');
  const galObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const sibs = $$('.gal-it', en.target.parentElement);
        const idx = sibs.indexOf(en.target);
        en.target.style.transitionDelay = (Math.max(idx, 0) * 0.06) + 's';
        en.target.classList.add('is-in');
        galObs.unobserve(en.target);
      }
    });
  }, { threshold: 0.1 });
  galItems.forEach(it => galObs.observe(it));

  /* ── Gallery Filter ─────────────────────────────────────── */
  $$('.gal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.gal-tab').forEach(t => t.classList.remove('is-on'));
      tab.classList.add('is-on');
      const f = tab.dataset.filter;
      galItems.forEach(it => {
        const match = f === 'all' || it.dataset.cat === f;
        it.classList.toggle('is-hidden', !match);
      });
    });
  });

  /* ── Gallery 3D Tilt ────────────────────────────────────── */
  if (matchMedia('(hover:hover)').matches && !reduceMotion) {
    galItems.forEach(it => {
      it.addEventListener('mousemove', e => {
        if (it.classList.contains('is-hidden')) return;
        const r = it.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const img = it.querySelector('img');
        if (img) img.style.transform = `scale(1.08) translate(${x * 14}px, ${y * 14}px)`;
      });
      it.addEventListener('mouseleave', () => {
        const img = it.querySelector('img');
        if (img) img.style.transform = '';
      });
    });
  }

  /* ── Lightbox ───────────────────────────────────────────── */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbNo = $('#lbNo');
  const lbTotal = $('#lbTotal');
  const lbTitle = $('#lbTitle');
  let lbIndex = 0;

  const visibleItems = () => galItems.filter(it => !it.classList.contains('is-hidden'));

  const openLb = (i) => {
    const items = visibleItems();
    if (!items.length) return;
    lbIndex = (i + items.length) % items.length;
    const it = items[lbIndex];
    lbImg.src = it.dataset.src || it.querySelector('img').src;
    lbNo.textContent = String(lbIndex + 1).padStart(2, '0');
    lbTotal.textContent = String(items.length).padStart(2, '0');
    lbTitle.textContent = it.querySelector('h4')?.textContent || '';
    lb.classList.add('is-on');
    document.body.style.overflow = 'hidden';
  };
  const closeLb = () => {
    lb.classList.remove('is-on');
    document.body.style.overflow = '';
  };
  galItems.forEach((it, k) => it.addEventListener('click', () => {
    const items = visibleItems();
    const realIdx = items.indexOf(it);
    if (realIdx >= 0) openLb(realIdx);
  }));

  /* Press cards — share lightbox in 'press' mode */
  const pressCards = $$('.press-card');
  let pressIdx = 0;
  const openPress = (i) => {
    if (!pressCards.length) return;
    pressIdx = (i + pressCards.length) % pressCards.length;
    const card = pressCards[pressIdx];
    const img = card.querySelector('img');
    if (!img) return;
    lbImg.src = img.src;
    lb.dataset.mode = 'press';
    if (lbNo) lbNo.textContent = String(pressIdx + 1).padStart(2, '0');
    if (lbTotal) lbTotal.textContent = String(pressCards.length).padStart(2, '0');
    const paper = card.querySelector('.press-paper')?.textContent || '';
    const date = card.querySelector('time')?.textContent || '';
    if (lbTitle) lbTitle.textContent = (paper + (date ? ' · ' + date : '')).trim();
    lb.classList.add('is-on');
    document.body.style.overflow = 'hidden';
  };
  pressCards.forEach((card, k) => card.addEventListener('click', () => openPress(k)));

  const _closeLb = closeLb;
  const closeBoth = () => { delete lb.dataset.mode; _closeLb(); };

  lb.addEventListener('click', e => {
    if (e.target.matches('[data-lb-close]') || e.target.closest('[data-lb-close]') || e.target === lb) {
      closeBoth();
    }
    if (e.target.matches('[data-lb-prev]') || e.target.closest('[data-lb-prev]')) {
      if (lb.dataset.mode === 'press') openPress(pressIdx - 1);
      else openLb(lbIndex - 1);
    }
    if (e.target.matches('[data-lb-next]') || e.target.closest('[data-lb-next]')) {
      if (lb.dataset.mode === 'press') openPress(pressIdx + 1);
      else openLb(lbIndex + 1);
    }
  });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-on')) return;
    if (e.key === 'Escape') closeBoth();
    if (e.key === 'ArrowLeft') {
      if (lb.dataset.mode === 'press') openPress(pressIdx - 1);
      else openLb(lbIndex - 1);
    }
    if (e.key === 'ArrowRight') {
      if (lb.dataset.mode === 'press') openPress(pressIdx + 1);
      else openLb(lbIndex + 1);
    }
  });

  /* ── Films / Inline YouTube Playback ────────────────────── */
  $$('.film').forEach(card => {
    const id = card.dataset.youtube;
    if (!id) return;
    card.addEventListener('click', () => {
      if (card.classList.contains('is-playing')) return;
      const params = 'autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3';
      const iframe = document.createElement('iframe');
      iframe.className = 'film-iframe';
      iframe.src = `https://www.youtube.com/embed/${id}?${params}`;
      iframe.title = 'Ganga County Film';
      iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
      iframe.allowFullscreen = true;
      card.appendChild(iframe);
      card.classList.add('is-playing');
    });
  });

  /* ── Amenities Showcase ─────────────────────────────────── */
  const atTiles = $$('.at');
  const afImgs = $$('.af-img');
  const afTitle = $('#afTitle');
  const afDesc = $('#afDesc');
  const afNo = $('#afNo');
  const afCat = $('#afCat');
  const afProg = $('#afProg');
  let afIdx = 0;
  let afTimer;

  const tilesEl = $('.amen-tiles');

  const setAmen = (i) => {
    if (!atTiles.length) return;
    afIdx = (i + atTiles.length) % atTiles.length;
    const tile = atTiles[afIdx];
    atTiles.forEach(t => t.classList.remove('is-on'));
    tile.classList.add('is-on');
    const id = tile.dataset.id;
    afImgs.forEach(img => img.classList.toggle('is-on', img.dataset.id === id));
    if (afTitle) afTitle.textContent = tile.dataset.title;
    if (afDesc) afDesc.textContent = tile.dataset.desc;
    if (afNo) afNo.textContent = String(id).padStart(2, '0') + ' / 12';
    if (afCat) afCat.textContent = tile.dataset.cat;
    // restart progress bar
    if (afProg) {
      afProg.style.transition = 'none';
      afProg.style.width = '0%';
      requestAnimationFrame(() => {
        afProg.style.transition = 'width 5s linear';
        afProg.style.width = '100%';
      });
    }
    // Auto-scroll active tile into view on mobile (horizontal swiper only)
    if (tilesEl && tilesEl.scrollWidth > tilesEl.clientWidth + 4) {
      const tRect = tile.getBoundingClientRect();
      const cRect = tilesEl.getBoundingClientRect();
      const target = tilesEl.scrollLeft + (tRect.left - cRect.left) - (cRect.width - tRect.width) / 2;
      tilesEl.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    }
  };

  const startAmenTimer = () => {
    clearInterval(afTimer);
    afTimer = setInterval(() => setAmen(afIdx + 1), 5000);
  };

  atTiles.forEach((tile, k) => {
    tile.addEventListener('mouseenter', () => {
      setAmen(k);
      startAmenTimer();
    });
    tile.addEventListener('click', () => {
      setAmen(k);
      startAmenTimer();
    });
  });
  if (atTiles.length) startAmenTimer();

  /* ── Master Plan in-view trigger ────────────────────────── */
  const masterFrame = $('.master-frame');
  if (masterFrame) {
    const mObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          mObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.25 });
    mObs.observe(masterFrame);
  }

  /* ── Chapter media in-view (clip-path reveal) ───────────── */
  const figObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        figObs.unobserve(en.target);
      }
    });
  }, { threshold: 0.2 });
  $$('.chapter-media figure').forEach(f => figObs.observe(f));

})();
