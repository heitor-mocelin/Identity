/* ============================================================
   Animated SAML/OAuth sequence-diagram engine — no dependencies.
   Renders any .seqflow[data-flow] container from the FLOWS catalog.
   ============================================================ */
(() => {
  const SVGNS = "http://www.w3.org/2000/svg";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const FLOWS = {
    "oauth-abstract": {
      title: "OAuth 2.0 — abstract flow (RFC 6749 §1.2)",
      actors: [
        { label: "You", icon: "🧑" },
        { label: "Client app", icon: "🖨️" },
        { label: "Auth Server", icon: "🛂" },
        { label: "Resource Server", icon: "🗄️" },
      ],
      steps: [
        { from: 1, to: 0, label: "(A) Authorization request", desc: "The app asks you for permission to access something on your behalf." },
        { from: 0, to: 1, label: "(B) Authorization grant", desc: "You approve — the app receives a grant representing your consent." },
        { from: 1, to: 2, label: "(C) Present grant", desc: "The app sends the grant to the authorization server to prove you approved." },
        { from: 2, to: 1, label: "(D) Access token", desc: "The server validates the grant and issues a scoped, expiring access token." },
        { from: 1, to: 3, label: "(E) Call API with token", desc: "The app presents the access token to the resource server." },
        { from: 3, to: 1, label: "(F) Protected resource", desc: "The resource server validates the token and returns your data." },
      ],
    },
    "oauth-code": {
      title: "Authorization Code flow with PKCE",
      actors: [
        { label: "You", icon: "🧑" },
        { label: "Client app", icon: "🖨️" },
        { label: "Auth Server", icon: "🛂" },
        { label: "Resource Server", icon: "🗄️" },
      ],
      steps: [
        { from: 0, to: 1, label: "Click “Connect”", desc: "You start the flow in the app. It generates a secret code_verifier and keeps it private." },
        { from: 1, to: 2, label: "Redirect + code_challenge", desc: "Browser is redirected to the authorization server with scope, state, and the hashed PKCE challenge." },
        { from: 2, to: 0, label: "Login + consent screen", desc: "You authenticate directly with the server and approve the requested scopes. The app never sees your password." },
        { from: 2, to: 1, label: "Redirect back with code", desc: "The server returns a short-lived, single-use authorization code to the app's redirect_uri (front channel)." },
        { from: 1, to: 2, label: "Exchange code + verifier", desc: "Back channel: the app POSTs the code plus the secret code_verifier to the token endpoint." },
        { from: 2, to: 1, label: "Access (+ refresh) token", desc: "The server checks the verifier against the challenge and returns the tokens — out of the browser's sight." },
        { from: 1, to: 3, label: "Call API: Bearer token", desc: "The app calls the resource server with Authorization: Bearer <token>." },
        { from: 3, to: 1, label: "Protected resource", desc: "Token valid → your photos are returned. Done!" },
      ],
    },
    "oidc-login": {
      title: "“Sign in with…” — OpenID Connect login",
      actors: [
        { label: "You", icon: "🧑" },
        { label: "App (RP)", icon: "📱" },
        { label: "OpenID Provider", icon: "🪪" },
      ],
      steps: [
        { from: 0, to: 1, label: "Click “Sign in with…”", desc: "You choose to log in with an identity provider." },
        { from: 1, to: 2, label: "Redirect: scope=openid + nonce", desc: "The app requests the openid scope (plus a nonce that ties the eventual ID token to this request)." },
        { from: 2, to: 0, label: "Authenticate + consent", desc: "You log in at the provider and approve sharing your identity / profile." },
        { from: 2, to: 1, label: "Code → exchanged for tokens", desc: "The app swaps the code for an access token AND an ID token (a signed JWT)." },
        { from: 1, to: 1, label: "Validate ID token", desc: "The app verifies the signature, issuer, audience, expiry and nonce, then reads 'sub' to identify you." },
        { from: 2, to: 1, label: "(Optional) UserInfo lookup", desc: "The app may call /userinfo with the access token for extra profile claims like name and email." },
      ],
    },
    "token-refresh": {
      title: "Refreshing an expired access token",
      actors: [
        { label: "Client app", icon: "📱" },
        { label: "Auth Server", icon: "🛂" },
        { label: "Resource Server", icon: "🗄️" },
      ],
      steps: [
        { from: 0, to: 2, label: "Call API: access token", desc: "The app uses its short-lived access token to call the API." },
        { from: 2, to: 0, label: "401 — token expired", desc: "The access token has expired, so the resource server rejects the call." },
        { from: 0, to: 1, label: "grant_type=refresh_token", desc: "Quietly, on the back channel, the app sends its longer-lived refresh token." },
        { from: 1, to: 0, label: "New access (+ rotated refresh)", desc: "The server returns a fresh access token — and ideally rotates the refresh token too. No user involved." },
        { from: 0, to: 2, label: "Retry API: new token", desc: "The app retries with the new token and succeeds. You never noticed." },
      ],
    },
    "client-credentials": {
      title: "Client Credentials grant (machine-to-machine)",
      actors: [
        { label: "Backend app", icon: "⚙️" },
        { label: "Auth Server", icon: "🛂" },
        { label: "Resource Server", icon: "🗄️" },
      ],
      steps: [
        { from: 0, to: 1, label: "client_id + client_secret", desc: "No user here. The app authenticates as ITSELF with grant_type=client_credentials over the back channel." },
        { from: 1, to: 0, label: "Access token", desc: "The server verifies the client's own credentials and returns an access token scoped to the app." },
        { from: 0, to: 2, label: "Call API: Bearer token", desc: "The app calls the resource server on its own behalf." },
        { from: 2, to: 0, label: "Protected resource", desc: "Token valid → data returned. Used for service-to-service jobs, cron tasks, and daemons." },
      ],
    },
    "device-code": {
      title: "Device Authorization grant (RFC 8628)",
      actors: [
        { label: "Device (TV)", icon: "📺" },
        { label: "Auth Server", icon: "🛂" },
        { label: "You + phone", icon: "📱" },
      ],
      steps: [
        { from: 0, to: 1, label: "Request codes (client_id)", desc: "The input-constrained device (smart TV, CLI) asks the authorization server to start a flow." },
        { from: 1, to: 0, label: "device_code + user_code + URL", desc: "The server returns a short user_code and a verification URL for you to visit elsewhere." },
        { from: 0, to: 0, label: "Display: “go to URL, enter ABCD-1234”", desc: "The device shows the code on screen — it can't open a browser itself." },
        { from: 2, to: 1, label: "Visit URL, enter code, log in + consent", desc: "On your phone or laptop, you open the URL, type the code, authenticate and approve." },
        { from: 0, to: 1, label: "Poll token endpoint…", desc: "Meanwhile the device politely polls the token endpoint, waiting for you to finish." },
        { from: 1, to: 0, label: "Access token (after approval)", desc: "Once you approve, the next poll returns the token. The device is connected — no keyboard required." },
      ],
    },
    "implicit": {
      title: "Implicit grant — RETIRED ⚠",
      actors: [
        { label: "You", icon: "🧑" },
        { label: "SPA (browser)", icon: "🌐" },
        { label: "Auth Server", icon: "🛂" },
      ],
      steps: [
        { from: 0, to: 1, label: "Click “Connect”", desc: "You start the flow in a single-page app." },
        { from: 1, to: 2, label: "Redirect: response_type=token", desc: "The app asks the authorization server to return a token DIRECTLY — no code, no exchange step." },
        { from: 2, to: 0, label: "Login + consent", desc: "You authenticate and approve at the authorization server." },
        { from: 2, to: 1, label: "⚠ Access token in the URL #fragment", desc: "The token is handed back in the redirect URL fragment — exposed to the browser, history, and any script on the page.", warn: true },
        { from: 1, to: 1, label: "⚠ Token leaks: history, Referer, logs, XSS", desc: "No back channel, no client authentication, no PKCE, and (by design) no refresh tokens. A leaked token is immediately usable. This is why Implicit is now retired.", warn: true },
      ],
    },
    "ropc": {
      title: "Resource Owner Password Credentials — RETIRED ⚠",
      actors: [
        { label: "You", icon: "🧑" },
        { label: "Client app", icon: "📱" },
        { label: "Auth Server", icon: "🛂" },
      ],
      steps: [
        { from: 0, to: 1, label: "⚠ Type your real username + password into the app", desc: "The app collects your actual credentials in its own UI — exactly the 'password anti-pattern' OAuth set out to kill.", warn: true },
        { from: 1, to: 1, label: "⚠ The app now sees your password", desc: "It can store, log, or misuse it. There's no consent screen and no way to scope down.", warn: true },
        { from: 1, to: 2, label: "grant_type=password (+ credentials)", desc: "The app forwards your username and password to the token endpoint." },
        { from: 2, to: 1, label: "Access token", desc: "The server returns a token. But MFA, SSO, and federated login can't work this way — and users are trained to hand passwords to apps. Hence: retired.", warn: true },
      ],
    },
    "saml-abstract": {
      title: "SAML — the 10,000-foot view",
      actors: [
        { label: "You", icon: "🧑" },
        { label: "Service Provider", icon: "🗄️" },
        { label: "Identity Provider", icon: "🛂" },
      ],
      steps: [
        { from: 0, to: 1, label: "Open the app", desc: "You try to access a SAML-connected application (the Service Provider)." },
        { from: 1, to: 2, label: "Go authenticate", desc: "The SP doesn't know you yet, so it sends you to the trusted Identity Provider." },
        { from: 2, to: 0, label: "Log in (once)", desc: "You authenticate at the IdP — the SP never sees your password." },
        { from: 2, to: 1, label: "Signed assertion", desc: "The IdP issues a digitally signed XML assertion vouching for who you are." },
        { from: 1, to: 0, label: "Logged in!", desc: "The SP verifies the signature, trusts the assertion, and logs you in." },
      ],
    },
    "saml-sso": {      title: "SP-initiated Web Browser SSO",
      actors: [
        { label: "Browser", icon: "🧑" },
        { label: "Service Provider", icon: "🗄️" },
        { label: "Identity Provider", icon: "🛂" },
      ],
      steps: [
        { from: 0, to: 1, label: "GET /app (no session)", desc: "You open the Service Provider; it finds no active session." },
        { from: 1, to: 0, label: "302 + SAMLRequest (Redirect)", desc: "The SP builds an AuthnRequest and redirects your browser to the IdP (HTTP-Redirect binding)." },
        { from: 0, to: 2, label: "Follow redirect to IdP", desc: "Your browser carries the SAMLRequest and RelayState to the Identity Provider." },
        { from: 2, to: 0, label: "Log in (once)", desc: "If you have no IdP session, you authenticate here — password, MFA, etc." },
        { from: 2, to: 0, label: "Auto-POST form w/ SAMLResponse", desc: "The IdP returns an HTML form (HTTP-POST binding) that auto-submits the signed assertion to the SP's ACS." },
        { from: 0, to: 1, label: "POST SAMLResponse → ACS", desc: "Your browser posts the SAMLResponse to the SP's Assertion Consumer Service." },
        { from: 1, to: 1, label: "Verify signature + conditions", desc: "The SP checks the signature, audience, timing and InResponseTo, then creates a local session." },
        { from: 1, to: 0, label: "Logged in → original page", desc: "You land on where you were headed via RelayState. Single sign-on complete. 🎉" },
      ],
    },
  };

  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function htmlEl(tag, cls, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  // Read the live theme palette from CSS variables so we can paint SVG via
  // presentation attributes (robust in webviews where CSS-class `fill` on SVG
  // text/shapes is not reliably applied, while attribute fills are).
  function palette() {
    const cs = getComputedStyle(document.documentElement);
    const g = (n, fb) => (cs.getPropertyValue(n).trim() || fb);
    return {
      text: g("--text", "#142433"),
      muted: g("--text-muted", "#5c5c5c"),
      accent: g("--accent", "#1d6fb8"),
      accentBright: g("--accent-bright", g("--accent", "#3ea0e6")),
      accentFg: g("--accent-fg", "#ffffff"),
      border: g("--border-strong", "#a9c8e6"),
      life: g("--border", "#cfe0f0"),
      actorFill: g("--surface-soft", "#f3f8fd"),
      danger: g("--danger", "#d23f4d"),
    };
  }

  const repainters = [];

  function render(container, spec) {
    container.innerHTML = "";
    const n = spec.actors.length;
    const VBW = 1000, marginX = 120, boxW = 156, boxH = 52;
    const colW = n > 1 ? (VBW - 2 * marginX) / (n - 1) : 0;
    const colX = (i) => marginX + i * colW;
    const topY = 28, lifeTop = topY + boxH + 10, firstRow = lifeTop + 44, rowH = 56;
    const H = firstRow + spec.steps.length * rowH + 10;

    // header
    const head = htmlEl("div", "seq-head", container);
    const title = htmlEl("span", "seq-title", head);
    title.textContent = spec.title;
    const count = htmlEl("span", "seq-count", head);

    // svg
    const svg = svgEl("svg", { viewBox: `0 0 ${VBW} ${H}`, role: "img", "aria-label": spec.title });
    svg.style.minHeight = Math.min(H, 560) + "px";
    container.appendChild(svg);

    let pal = palette();

    const defs = svgEl("defs", {}, svg);
    const baseId = "ah-" + Math.random().toString(36).slice(2, 8);
    function makeMarker(id, color) {
      const mk = svgEl("marker", { id, markerWidth: 9, markerHeight: 9, refX: 7, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, defs);
      return svgEl("path", { d: "M0,0 L7,3 L0,6 Z", fill: color }, mk);
    }
    const mkBase = makeMarker(baseId + "-b", pal.border);
    const mkAccent = makeMarker(baseId + "-a", pal.accent);
    const mkDanger = makeMarker(baseId + "-d", pal.danger);

    // lifelines + actor boxes
    const lifeEls = [], actorRects = [], actorLabels = [];
    for (let i = 0; i < n; i++) {
      const x = colX(i);
      lifeEls.push(svgEl("line", { class: "seq-life", x1: x, y1: lifeTop, x2: x, y2: H - 14, stroke: pal.life, "stroke-width": 2, "stroke-dasharray": "3 5" }, svg));
      actorRects.push(svgEl("rect", { x: x - boxW / 2, y: topY, width: boxW, height: boxH, rx: 12, fill: pal.actorFill, stroke: pal.accent, "stroke-opacity": 0.45, "stroke-width": 1.5 }, svg));
      const ic = svgEl("text", { x: x, y: topY + 24, "text-anchor": "middle", "font-size": 19 }, svg);
      ic.textContent = spec.actors[i].icon;
      const label = spec.actors[i].label;
      const fs = label.length > 15 ? 11 : 12.5;
      const lb = svgEl("text", { x: x, y: topY + 43, "text-anchor": "middle", "font-size": fs, "font-weight": 600, "font-family": "var(--sans)", fill: pal.text }, svg);
      lb.textContent = label;
      actorLabels.push(lb);
    }

    // steps
    const stepEls = [];
    spec.steps.forEach((st, i) => {
      const y = firstRow + i * rowH;
      const g = svgEl("g", {}, svg);
      const fromX = colX(st.from), toX = colX(st.to);
      let arrow, label;
      if (st.from === st.to) {
        const x = fromX, w = 48, hh = 22;
        arrow = svgEl("path", { d: `M ${x} ${y - hh / 2} h ${w} v ${hh} h ${-w}`, fill: "none", "stroke-width": 2 }, g);
        label = svgEl("text", { x: x + w + 9, y: y, "text-anchor": "start", "font-size": 12.5, "font-family": "var(--sans)" }, g);
      } else {
        const dir = toX > fromX ? 1 : -1;
        const x1 = fromX + dir * 6, x2 = toX - dir * 6;
        arrow = svgEl("line", { x1, y1: y, x2, y2: y, "stroke-width": 2 }, g);
        label = svgEl("text", { x: (fromX + toX) / 2, y: y - 9, "text-anchor": "middle", "font-size": 12.5, "font-family": "var(--sans)" }, g);
      }
      label.textContent = st.label;
      stepEls.push({ g, arrow, label, warn: !!st.warn });
    });

    // packet
    const packetG = svgEl("g", {}, svg);
    const packet = svgEl("circle", { r: 9, cx: 0, cy: 0, "stroke-width": 2.5 }, packetG);
    packetG.style.opacity = "0";

    function paintStatic(p) {
      mkBase.setAttribute("fill", p.border);
      mkAccent.setAttribute("fill", p.accent);
      mkDanger.setAttribute("fill", p.danger);
      lifeEls.forEach((l) => l.setAttribute("stroke", p.life));
      actorRects.forEach((r) => { r.setAttribute("fill", p.actorFill); r.setAttribute("stroke", p.accent); });
      actorLabels.forEach((l) => l.setAttribute("fill", p.text));
      packet.setAttribute("fill", p.accentBright);
      packet.setAttribute("stroke", "rgba(255,255,255,0.9)");
    }

    function styleStep(s, state) {
      const warnCol = s.warn ? pal.danger : pal.accent;
      if (state === "active") {
        s.arrow.setAttribute("stroke", warnCol);
        s.arrow.setAttribute("stroke-width", 3.5);
        s.arrow.setAttribute("opacity", 1);
        s.arrow.setAttribute("marker-end", `url(#${s.warn ? baseId + "-d" : baseId + "-a"})`);
        s.label.setAttribute("fill", s.warn ? pal.danger : pal.text);
        s.label.setAttribute("font-weight", 700);
        s.label.setAttribute("opacity", 1);
      } else if (state === "past") {
        s.arrow.setAttribute("stroke", s.warn ? pal.danger : pal.accent);
        s.arrow.setAttribute("stroke-width", 2);
        s.arrow.setAttribute("opacity", 0.55);
        s.arrow.setAttribute("marker-end", `url(#${s.warn ? baseId + "-d" : baseId + "-a"})`);
        s.label.setAttribute("fill", pal.muted);
        s.label.setAttribute("font-weight", 500);
        s.label.setAttribute("opacity", 0.95);
      } else {
        s.arrow.setAttribute("stroke", pal.border);
        s.arrow.setAttribute("stroke-width", 2);
        s.arrow.setAttribute("opacity", 0.4);
        s.arrow.setAttribute("marker-end", `url(#${baseId + "-b"})`);
        s.label.setAttribute("fill", pal.muted);
        s.label.setAttribute("font-weight", 500);
        s.label.setAttribute("opacity", 0.45);
      }
    }

    function repaint() {
      pal = palette();
      paintStatic(pal);
      stepEls.forEach((s, i) => styleStep(s, i < cur ? "past" : i === cur ? "active" : "future"));
    }
    repainters.push(repaint);
    paintStatic(pal);

    // caption
    const cap = htmlEl("div", "seq-caption", container);

    // controls
    const ctrls = htmlEl("div", "seq-controls", container);
    const btnPrev = htmlEl("button", "seq-btn", ctrls); btnPrev.textContent = "‹ Prev";
    const btnPlay = htmlEl("button", "seq-btn primary", ctrls);
    const btnNext = htmlEl("button", "seq-btn", ctrls); btnNext.textContent = "Next ›";
    const btnReplay = htmlEl("button", "seq-btn", ctrls); btnReplay.textContent = "⟳ Replay";
    const dots = htmlEl("div", "seq-dots", ctrls);
    const dotEls = spec.steps.map((_, i) => {
      const d = htmlEl("button", "seq-dot", dots);
      d.setAttribute("aria-label", "Go to step " + (i + 1));
      d.addEventListener("click", () => { stop(); goTo(i); });
      return d;
    });

    let cur = -1, timer = null, playing = false;

    function setClasses() {
      stepEls.forEach((s, i) => styleStep(s, i < cur ? "past" : i === cur ? "active" : "future"));
      dotEls.forEach((d, i) => d.classList.toggle("on", i === cur));
      count.textContent = (cur + 1) + " / " + spec.steps.length;
      const st = spec.steps[cur];
      cap.classList.toggle("warn", !!st.warn);
      cap.innerHTML = "<b>Step " + (cur + 1) + "</b> " + st.desc;
    }

    function movePacket(st) {
      if (reduce) { packetG.style.opacity = "0"; return; }
      const idx = spec.steps.indexOf(st);
      const y = firstRow + idx * rowH;
      let x1, x2;
      if (st.from === st.to) { x1 = colX(st.from); x2 = x1 + 48; }
      else { x1 = colX(st.from); x2 = colX(st.to); }
      packet.setAttribute("fill", st.warn ? pal.danger : pal.accentBright);
      packetG.style.opacity = "1";
      try {
        packetG.animate(
          [{ transform: `translate(${x1}px,${y}px)` }, { transform: `translate(${x2}px,${y}px)` }],
          { duration: 650, easing: "cubic-bezier(.45,0,.3,1)", fill: "forwards" }
        );
      } catch (e) {
        packet.setAttribute("cx", x2); packet.setAttribute("cy", y);
      }
    }

    function goTo(i) {
      cur = Math.max(0, Math.min(spec.steps.length - 1, i));
      setClasses();
      movePacket(spec.steps[cur]);
    }

    function next() {
      if (cur >= spec.steps.length - 1) { stop(); return; }
      goTo(cur + 1);
    }
    function prev() { stop(); goTo(cur - 1); }

    function play() {
      if (cur >= spec.steps.length - 1) goTo(0);
      playing = true; btnPlay.textContent = "⏸ Pause";
      clearInterval(timer);
      timer = setInterval(() => {
        if (cur >= spec.steps.length - 1) { stop(); return; }
        goTo(cur + 1);
      }, 2100);
    }
    function stop() {
      playing = false; btnPlay.textContent = "▶ Play";
      clearInterval(timer); timer = null;
    }

    btnPlay.addEventListener("click", () => (playing ? stop() : play()));
    btnNext.addEventListener("click", () => { stop(); next(); });
    btnPrev.addEventListener("click", prev);
    btnReplay.addEventListener("click", () => { stop(); goTo(0); if (!reduce) play(); });

    goTo(0);
    if (!reduce) {
      // autoplay when scrolled into view, once
      let started = false;
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && !started) { started = true; play(); io.disconnect(); }
        });
      }, { threshold: 0.35 });
      io.observe(container);
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".seqflow[data-flow]").forEach((c) => {
      const spec = FLOWS[c.getAttribute("data-flow")];
      if (spec) render(c, spec);
    });
    // Repaint all diagrams when the theme changes (data-theme on <html>).
    const mo = new MutationObserver(() => repainters.forEach((fn) => fn()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  });
})();
