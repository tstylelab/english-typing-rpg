// Track only the dedicated browser created by this test, never a user's Chrome.
export async function trackTestBrowser(browser) {
  const session = await browser.newBrowserCDPSession();
  const { processInfo } = await session.send('SystemInfo.getProcessInfo');
  const pid = processInfo.find(process => process.type === 'browser')?.id;
  await session.detach();
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('Missing test browser PID');
  return async () => {
    let timer;
    try {
      await Promise.race([
        browser.close(),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Chrome shutdown timeout')), 10000); }),
      ]);
    } catch (error) {
      // The browser may already have exited while the automation pipe still
      // waits for its acknowledgement. Signal 0 only checks process existence.
      try {
        process.kill(pid, 0);
      } catch (probeError) {
        if (probeError.code === 'ESRCH') {
          console.warn(`Dedicated test Chrome PID ${pid} already exited; shutdown acknowledgement timed out.`);
          return;
        }
        throw probeError;
      }
      // A browser that is still running is a genuine cleanup failure.
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };
}
