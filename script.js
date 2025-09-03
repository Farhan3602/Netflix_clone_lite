// -----------------------------
// Email subscription alert
// -----------------------------
document.querySelectorAll('.email-form').forEach(form => {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const input = this.querySelector('input[type="email"], input#email, input[name="email"]');
    const email = input?.value?.trim() || '';
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      alert('Please enter a valid email.');
      input?.focus();
      return;
    }
    alert('Subscription feature coming soon!');
    this.reset();
  });
});

// -----------------------------
// Accessible FAQ accordion
// -----------------------------
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-question');
  const panel = item.querySelector('.faq-answer');

  // Initialize ARIA
  if (btn && panel) {
    const pid = panel.id || `faq-panel-${Math.random().toString(36).slice(2)}`;
    panel.id = pid;
    btn.setAttribute('aria-controls', pid);
    btn.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');

    btn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Collapse others
      document.querySelectorAll('.faq-item.active').forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          const ob = other.querySelector('.faq-question');
          const oa = other.querySelector('.faq-answer');
          ob?.setAttribute('aria-expanded', 'false');
          oa?.setAttribute('aria-hidden', 'true');
        }
      });

      // Toggle current
      item.classList.toggle('active', !isActive);
      btn.setAttribute('aria-expanded', String(!isActive));
      panel.setAttribute('aria-hidden', String(isActive));
    });

    // Optional: arrow key nav across questions
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = Array.from(document.querySelectorAll('.faq-question'));
        const idx = items.indexOf(btn);
        const next = e.key === 'ArrowDown' ? items[idx + 1] : items[idx - 1];
        next?.focus();
      }
    });
  }
});

// -----------------------------
// Trending/Top 10 hydration
// Sources:
// - Netflix Tudum Top 10 (weekly, per region)
// - FlixPatrol (daily, fallback)
// Notes:
// - Direct client fetch may be blocked by CORS. For production,
//   consider a tiny serverless proxy that returns JSON.
// -----------------------------

async function safeFetchText(url) {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return res.text();
}

// Parse Tudum Top 10 HTML heuristically
function parseTudum(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Try specific hooks first
  let cards = Array.from(doc.querySelectorAll('[data-uia="top10-item"], [data-uia="top10-row"] article, li'));
  if (cards.length === 0) {
    // Fallback to generic articles with images and title text
    cards = Array.from(doc.querySelectorAll('article, li, div')).filter(el => el.querySelector('img'));
  }

  const items = [];
  for (const el of cards) {
    const rankText =
      el.querySelector('[data-uia="top10-rank"], .rank, .top10-rank, [class*="rank"]')?.textContent?.trim() || '';
    const rankNum = parseInt((rankText.match(/\d+/) || [])[0] || '', 10);
    const title =
      el.querySelector('[data-uia="title"], h3, h2, .title, figcaption, [class*="title"]')?.textContent?.trim() || '';
    const img =
      el.querySelector('img')?.getAttribute('data-src') ||
      el.querySelector('img')?.getAttribute('src') || '';

    if (title && img) {
      items.push({
        rank: Number.isFinite(rankNum) ? rankNum : undefined,
        title,
        img
      });
    } else if (title) {
      items.push({
        rank: Number.isFinite(rankNum) ? rankNum : undefined,
        title
      });
    }
  }

  // Keep first 10; if ranks exist, sort by rank asc
  let top = items.slice(0, 20);
  const withRank = top.filter(i => typeof i.rank === 'number');
  if (withRank.length >= 5) {
    top = top
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
      .slice(0, 10);
  } else {
    top = top.slice(0, 10);
  }
  return top;
}

// Parse FlixPatrol HTML tables as fallback (very heuristic; structure may change)
function parseFlixPatrol(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const rows = [];
  // Attempt to find rank/title in table rows
  doc.querySelectorAll('table tr').forEach(tr => {
    const tds = Array.from(tr.querySelectorAll('td'));
    if (tds.length >= 2) {
      const maybeRank = tds[0].textContent.trim();
      const rankNum = parseInt((maybeRank.match(/\d+/) || [])[0] || '', 10);
      // Title could be an <a>, span, or raw text
      const title = tds[1].querySelector('a, span')?.textContent?.trim() || tds[1].textContent.trim();
      if (title && Number.isFinite(rankNum)) {
        rows.push({ rank: rankNum, title });
      }
    }
  });
  // Limit to 10
  return rows.slice(0, 10);
}

// Fetch Tudum by region/type
async function fetchTudumTop10({ region = 'india', type = 'films' }) {
  // Netflix Tudum uses paths like: /tudum/top10/{region}/{films|tv}
  const url = `https://www.netflix.com/tudum/top10/${encodeURIComponent(region)}/${type === 'tv' ? 'tv' : 'films'}`;
  const html = await safeFetchText(url);
  return parseTudum(html);
}

// Fetch FlixPatrol by country (fallback)
async function fetchFlixPatrolTop10({ country = 'india' }) {
  const url = `https://flixpatrol.com/top10/netflix/${encodeURIComponent(country.toLowerCase())}/`;
  const html = await safeFetchText(url);
  return parseFlixPatrol(html);
}

// Render helper
function renderCarousel(sectionEl, items) {
  const list = sectionEl.querySelector('.content-carousel');
  if (!list) return;
  list.innerHTML = '';

  if (!items || items.length === 0) {
    list.innerHTML = '<p style="color:#b3b3b3">No chart data available.</p>';
    return;
  }

  items.slice(0, 10).forEach((it, idx) => {
    const img = document.createElement('img');
    img.loading = 'lazy';
    const rank = it.rank ?? (idx + 1);
    img.alt = `${it.title || 'Title'} (Rank ${rank})`;
    img.src = it.img || `https://via.placeholder.com/260x170?text=${encodeURIComponent((rank + '. ' + (it.title || 'Top')))}`;
    img.setAttribute('role', 'listitem');
    list.appendChild(img);
  });
}

// Main hydrator
async function hydrateCharts() {
  // Expecting structure like:
  // <div id="charts">
  //   <section class="row" data-source="tudum" data-region="india" data-type="films"> ... <div class="content-carousel"></div></section>
  //   <section class="row" data-source="tudum" data-region="india" data-type="tv"> ... <div class="content-carousel"></div></section>
  // </div>
  const rows = document.querySelectorAll('#charts .row');
  if (rows.length === 0) return;

  for (const row of rows) {
    const source = (row.dataset.source || 'tudum').toLowerCase();
    const region = row.dataset.region || 'india';
    const type = (row.dataset.type || 'films').toLowerCase();

    try {
      let items;
      if (source === 'tudum') {
        items = await fetchTudumTop10({ region, type });
      } else {
        items = await fetchFlixPatrolTop10({ country: region });
      }

      if (!items || items.length === 0) throw new Error('No items from primary source');
      renderCarousel(row, items);
    } catch (err) {
      console.warn('Primary chart fetch failed, trying FlixPatrol fallback:', err);
      try {
        const items = await fetchFlixPatrolTop10({ country: region });
        renderCarousel(row, items.map((r, i) => ({ rank: r.rank ?? (i + 1), title: r.title })));
      } catch (fallbackErr) {
        console.error('Fallback chart fetch failed:', fallbackErr);
        const list = row.querySelector('.content-carousel');
        if (list) list.innerHTML = '<p style="color:#b3b3b3">Unable to load charts right now.</p>';
      }
    }
  }
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hydrateCharts);
} else {
  hydrateCharts();
}

/*
CORS/production note:
- Direct client fetches to Tudum/FlixPatrol can be blocked by CORS. For production, route through a tiny serverless proxy:
  Example endpoint: /api/top10?source=tudum&region=india&type=films
  The proxy should fetch server-side and return normalized JSON:
  [{ rank: 1, title: '...', img: '...' }, ...]
- For consistent poster art, consider resolving titles to TMDB IDs server-side and returning poster_path as
  https://image.tmdb.org/t/p/w300/<poster_path>
*/
