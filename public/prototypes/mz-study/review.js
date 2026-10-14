(() => {
  const dimensions = {desktop: [1440, 900], mobile: [390, 844], 'mobile-small': [375, 667]};
  const stage = document.querySelector('#frame-stage');
  const space = document.querySelector('#frame-space');
  const frame = document.querySelector('#artwork');
  const buttons = [...document.querySelectorAll('[data-view]')];
  let view = new URLSearchParams(location.search).get('view');
  if (!dimensions[view]) view = innerWidth < 700 ? 'mobile' : 'desktop';
  function layout() {
    const [w, h] = dimensions[view], scale = Math.min(1, stage.clientWidth / w);
    frame.style.width = `${w}px`; frame.style.height = `${h}px`; frame.style.transform = `scale(${scale})`;
    space.style.width = `${w * scale}px`; space.style.height = `${h * scale}px`;
    stage.classList.toggle('mobile', view !== 'desktop');
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    document.querySelector('#viewport-label').textContent = `${w} × ${h}`;
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    view = button.dataset.view;
    const url = new URL(location.href); url.searchParams.set('view', view); history.replaceState(null, '', url);
    layout();
  }));
  new ResizeObserver(layout).observe(stage); layout();
})();
