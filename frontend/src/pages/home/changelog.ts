export async function loadChangelog(lang: 'zh' | 'en' = 'zh') {
  const changelogList = document.getElementById('changelog-list');
  if (!changelogList) return;

  try {
    const primaryUrl = lang === 'en' ? '/data/changelog.en.json' : '/data/changelog.json';
    let response = await fetch(primaryUrl);
    if (!response.ok && lang === 'en') {
      response = await fetch('/data/changelog.json');
    }
    if (!response.ok) return;

    const changelog = await response.json();
    renderChangelog(changelog);
  } catch (error) {
    console.log('Changelog data not available, using static content');
  }
}

function renderChangelog(
  changelog: Array<{ date: string; title: string; description?: string }>
) {
  const changelogList = document.getElementById('changelog-list');
  if (!changelogList || !changelog.length) return;

  changelogList.innerHTML = changelog
    .slice(0, 5)
    .map(
      (item) => `
        <div class="changelog-item">
            <span class="changelog-date">${item.date}</span>
            <div class="changelog-content">
                <div class="changelog-title">${item.title}</div>
                <div class="changelog-desc">${item.description || ''}</div>
            </div>
        </div>
    `
    )
    .join('');
}
