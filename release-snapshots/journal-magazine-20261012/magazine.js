/* Journal-only controls. Newsletter delivery is handled by main.js/subscribe.php. */
(() => {
  const init = () => {
    const main = document.querySelector('.jm-journal');
    if (!main) return;
    const stories = Array.from(main.querySelectorAll('[data-jm-categories]'));
    const tabs = Array.from(main.querySelectorAll('[data-jm-filter]'));
    const count = main.querySelector('[data-jm-count]');
    const status = main.querySelector('[data-jm-filter-status]');
    const empty = main.querySelector('[data-jm-empty]');
    tabs.forEach(tab => tab.addEventListener('click', () => {
      const filter = tab.dataset.jmFilter;
      let total = 0;
      stories.forEach(story => {
        const visible = filter === 'all' || story.dataset.jmCategories.split(' ').includes(filter);
        story.hidden = !visible;
        if (visible) total++;
      });
      tabs.forEach(t => t.setAttribute('aria-pressed', String(t === tab)));
      const text = `${total} article${total === 1 ? '' : 's'}`;
      count.textContent = text;
      status.textContent = `${tab.textContent.trim()} : ${text}`;
      empty.hidden = total !== 0;
    }));
    const archive = main.querySelector('#jm-all-guides');
    if (location.hash === '#jm-all-guides') archive.open = true;
    main.querySelector('[data-jm-open-archives]').addEventListener('click', event => {
      event.preventDefault();
      archive.open = true;
      history.replaceState(null, '', location.pathname + location.search + '#jm-all-guides');
      archive.scrollIntoView({behavior:'auto', block:'start'});
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
