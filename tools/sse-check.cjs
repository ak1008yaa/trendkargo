// اسکریپت کمکی تأیید اتصال SSE — صرفاً برای تست دستی نگه داشته شده است.
(async () => {
  const base = 'http://localhost:3000';
  const r = await fetch(base + '/api/events');
  const rd = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let fired = false;

  setTimeout(async () => {
    const post = await fetch(base + '/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ news: [{ id: 999, title: 'تست لحظه‌ای SSE' }] })
    });
    console.log('POST status:', post.status);
    fired = true;
  }, 1500);

  const timer = setTimeout(() => { console.log('TIMEOUT. buffer:', JSON.stringify(buf.slice(0, 500))); rd.cancel().finally(() => process.exit(1)); }, 10000);

  while (true) {
    const { done, value } = await rd.read();
    if (done) break;
    buf += dec.decode(value);
    if (fired && buf.includes('store-update')) {
      console.log('SSE EVENT RECEIVED:');
      console.log(buf.split('\n\n').filter((x) => x.includes('store-update')).join('\n'));
      clearTimeout(timer);
      rd.cancel().finally(() => process.exit(0));
    }
  }
})();