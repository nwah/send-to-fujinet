let fnHost = "";

chrome.contextMenus.create({
  id: "send-to-fujinet",
  title: "Send to FujiNet",
  contexts: ["link"],
});

chrome.contextMenus.onClicked.addListener((event) => {
  if (event.menuItemId === "send-to-fujinet") {
    sendToFujiNet(event.linkUrl);
  }
});

async function sendToFujiNet(rawUrl) {
  if (!/\.xex$|\.atr$|\.atx$/i.test(rawUrl)) {
    return alert("Not supported!");
  }

  const url = URL.parse(rawUrl);
  if (!fnHost) {
    fnHost = await findFujinet();
  }
  if (!fnHost) {
    return alert("Can't find FujiNet!");
  }

  const hostSlot = await findOrMountHost(url.origin);
  const deviceSlot = 1;

  await mount(deviceSlot, hostSlot + 1, url.pathname, "r");
}

async function findFujinet() {
  let accessible = false;
  const options = ["localhost:8000", "fujinet.local", "fujinet"];

  while (options.length && !accessible) {
    fnHost = options.shift();
    accessible = await checkHostAccessible(fnHost);
  }

  if (!accessible) {
    fnHost = "";
  }

  return fnHost;
}

async function checkHostAccessible(host) {
  try {
    await fetch(`http://${host}/hosts`, {
      signal: AbortSignal.timeout(500),
    });
    return true;
  } catch (_err) {
    return false;
  }
}

async function findOrMountHost(hostname) {
  const hosts = await getHosts();
  console.log({ hosts });
  const current = hosts.indexOf(hostname);
  if (current > -1) return current;
  await setHost(7, hostname);
  return 7;
}

async function getHosts() {
  const res = await fetch(`http://${fnHost}/hosts`).then((res) => res.text());
  return res.split("\n");
}

async function setHost(slot, hostname) {
  const res = await fetch(
    `http://${fnHost}/hosts?hostslot=${slot}&hostname=${hostname}`,
    { method: "POST" },
  ).then((res) => res.text());
  return res.split("\n");
}

async function mount(slot, host, path, mode = "r") {
  await fetch(
    `http://${fnHost}/browse/host/${host}${path}?action=newmount&slot=${slot}&mode=${mode}`,
  );
}
