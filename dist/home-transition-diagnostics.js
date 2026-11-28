'use strict';

// This one-shot test stays in memory and reads layout measurements only.
const homeDiagnosticSettings = appSettingsPage;
appSettingsPage = () => homeDiagnosticSettings() +
 '<section class="page"><div class="native-group">' +
 button('test-home-transition', 'Тест переходу з головної', 'question') +
 '</div></section>';

const homeDiagnosticTargets = {
 balance: '.home-balance strong',
 card: '.card-carousel .card-face:not(.new-card-face)',
 cardArt: '.card-carousel .card-face:not(.new-card-face) .bank-card-front',
 allCards: '.card-selector',
 allCardsLabel: '.card-selector .selector-label',
 actions: '.home-actions',
 operations: '.operation-panel:not(.account-swipe-preview)'
};

const diagnosticRound = number => Math.round(number * 100) / 100;
let homeDiagnostic = null;

function readHomeDiagnostic(timestamp, stage) {
 const app = $('#app');
 const layer = $('.side-page-snapshot.home');
 const home = app.classList.contains('home') ? app : layer;
 const viewport = window.visualViewport;
 const viewportTop = viewport?.offsetTop ?? 0;
 const frame = {
  ms: diagnosticRound(timestamp - homeDiagnostic.started),
  stage,
  source: home === app ? 'live' : home ? 'transition' :
   document.documentElement.dataset.capturedHome ? 'viewport-capture' : 'covered',
  viewportTop: diagnosticRound(viewportTop),
  scroll: diagnosticRound(pageScrollY()),
  foregroundX: diagnosticRound(app.getBoundingClientRect().left)
 };
 if (!home) return frame;
 const origin = home.getBoundingClientRect();
 frame.homeX = diagnosticRound(origin.left);
 frame.homeY = diagnosticRound(origin.top - viewportTop);
 const track = home.querySelector('.card-track');
 const slides = track?.children;
 const activeIndex = newCardSelected ? (slides?.length ?? 1) - 1 :
  allCards().findIndex(card => card.id === state.activeCard);
 const activeSlide = slides?.[Math.max(0, activeIndex)];
 for (const [key, selector] of Object.entries(homeDiagnosticTargets)) {
  const node = key === 'card' ? activeSlide?.querySelector('.card-face') :
   key === 'cardArt' ? activeSlide?.querySelector('.bank-card-front') : home.querySelector(selector);
  if (!node) continue;
  const {left, top, width, height} = node.getBoundingClientRect();
  frame[key] = [left - origin.left, top - viewportTop, width, height].map(diagnosticRound);
 }
 return frame;
}

function stopHomeDiagnostic() {
 const test = homeDiagnostic;
 if (!test) return;
 clearTimeout(test.expiration);
 cancelAnimationFrame(test.frame);
 homeDiagnostic = null;
}

function showHomeDiagnostic(test) {
 const viewport = window.visualViewport;
 const report = JSON.stringify({
  build: 252,
  viewportCaptureSupported: typeof document.startViewTransition === 'function',
  standalone: Boolean(navigator.standalone || matchMedia('(display-mode: standalone)').matches),
  devicePixelRatio: devicePixelRatio,
  viewport: [viewport?.width ?? innerWidth, viewport?.height ?? innerHeight].map(diagnosticRound),
  coordinates: ['relativeX', 'visibleY', 'width', 'height'],
  frames: test.frames
 });
 modal('Звіт про перехід',
  '<p class="form-note">Звіт містить лише координати й час кадрів. Скопіюй його в чат.</p>' +
  '<textarea id="home-diagnostic-report" aria-label="Звіт про перехід" rows="5" readonly></textarea>' +
  '<button type="button" class="secondary" data-action="copy-home-diagnostic">Скопіювати звіт</button>',
  null);
 $('#home-diagnostic-report').value = report;
}

actions['copy-home-diagnostic'] = async () => {
 const field = $('#home-diagnostic-report');
 if (!field) return;
 try {
  await navigator.clipboard.writeText(field.value);
  toast('Звіт скопійовано');
 } catch {
  field.focus({preventScroll: true});
  field.select();
 }
};

actions['test-home-transition'] = () => {
 stopHomeDiagnostic();
 navigate('home');
 if (route.page !== 'home') return;
 homeDiagnostic = {started: null, frames: [], expiration: setTimeout(stopHomeDiagnostic, 30000)};
 toast('Тест увімкнено. Натисни «Переказ на картку».');
};

document.addEventListener('pointerdown', event => {
 const test = homeDiagnostic;
 const trigger = event.target.closest('#app.home .home-actions button');
 if (!test || test.started !== null || !event.isPrimary || event.button !== 0 || !trigger ||
     !trigger.matches('[data-action="transfer"],[data-page="transfer"]')) return;
 test.started = performance.now();
 test.frames.push(readHomeDiagnostic(test.started, 'pointerdown'));
 const sample = timestamp => {
  if (homeDiagnostic !== test) return;
  const frame = readHomeDiagnostic(timestamp, 'frame');
  test.frames.push(frame);
  if (route.page === 'transfer' && !sideEntrance || timestamp - test.started > 1800) {
   stopHomeDiagnostic();
   if (route.page === 'transfer') showHomeDiagnostic(test);
   else toast('Тест завершено без переходу. Запусти його ще раз у налаштуваннях.');
   return;
  }
  test.frame = requestAnimationFrame(sample);
 };
 test.frame = requestAnimationFrame(sample);
}, {capture: true, passive: true});

document.addEventListener('click', event => {
 if (homeDiagnostic?.started != null && event.target.closest('#app.home .home-actions button')) {
  homeDiagnostic.frames.push(readHomeDiagnostic(performance.now(), 'click'));
 }
}, true);
