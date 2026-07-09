import { useState, useEffect } from 'react';
import { AuthButton } from '../auth/AuthButton.jsx';
import { playOpeningMusic, stopOpeningMusic } from '../sim/sound.js';

const SITE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,800;9..144,900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
.vd*,.vd *::before,.vd *::after{box-sizing:border-box}
.vd{--bg:#FAF6EC;--bg-2:#F2EBDC;--bg-dark:#0E1612;--ink:#1A1F1A;--ink-2:#44524A;--ink-3:#7A8780;--line:rgba(26,31,26,.10);--line-2:rgba(26,31,26,.18);--green:#2A6E45;--green-dk:#154428;--green-lt:#E5EFE2;--ember:#D9621E;--ember-dk:#A2440B;--sand:#E8D4A8;--font-display:'Fraunces',Georgia,serif;--font-body:'Inter',system-ui,sans-serif;--font-mono:'JetBrains Mono',monospace;font:16px/1.55 var(--font-body);color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased}
.vd img{display:block;max-width:100%}
.vd a{color:inherit}
.vd h1,.vd h2,.vd h3{font-family:var(--font-display);font-weight:700;letter-spacing:-0.02em;color:var(--ink);margin:0}
.vd h1{font-size:clamp(40px,6vw,88px);line-height:.96;font-weight:800;letter-spacing:-0.03em}
.vd h2{font-size:clamp(28px,3.5vw,52px);line-height:1.06}
.vd h3{font-size:clamp(18px,2vw,24px);line-height:1.15}
.vd p{color:var(--ink-2);margin:0;line-height:1.65}

/* Nav */
.vd-nav{position:sticky;top:0;z-index:50;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:24px;padding:14px 48px;background:rgba(250,246,236,.85);backdrop-filter:blur(18px) saturate(150%);border-bottom:1px solid var(--line)}
.vd-logo{display:flex;align-items:center;gap:10px;cursor:pointer;background:none;border:none;font:inherit;color:var(--ink)}
.vd-logo-mark{width:28px;height:28px;background:linear-gradient(135deg,var(--green),var(--green-dk));border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--font-display);font-weight:800;font-size:16px}
.vd-logo-name{font-family:var(--font-display);font-weight:700;font-size:17px;letter-spacing:-0.01em}
.vd-nav-links{display:flex;justify-content:center;gap:28px}
.vd-nav-auth.auth-btn{background:var(--bg-2);color:var(--ink);border-color:var(--line-2)}
.vd-nav-auth.auth-btn:hover{background:var(--sand)}
.vd-nav-auth.auth-btn-signin{background:var(--green);color:#fff;border-color:var(--green)}
.vd-nav-auth.auth-btn-signin:hover{background:var(--green-dk)}
.vd-nav-auth.auth-chip-btn{background:var(--bg-2);color:var(--ink);border-color:var(--line-2)}
.vd-nav-right{display:flex;align-items:center;gap:10px}
.vd-hamburger{display:none;flex-direction:column;gap:5px;padding:8px 6px;background:none;border:1px solid var(--line);border-radius:8px;cursor:pointer}
.vd-hamburger span{display:block;width:20px;height:2px;background:var(--ink);border-radius:999px;transition:all .2s}
.vd-hamburger span.open:nth-child(1){transform:translateY(7px) rotate(45deg)}
.vd-hamburger span.open:nth-child(2){opacity:0}
.vd-hamburger span.open:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.vd-mobile-nav{position:sticky;top:56px;z-index:49;background:rgba(250,246,236,.98);backdrop-filter:blur(16px);border-bottom:1px solid var(--line);padding:8px 12px 16px;display:none}
.vd-mobile-nav-links{display:flex;flex-direction:column;gap:2px;margin-bottom:12px}
.vd-mobile-nav-links button{display:flex;align-items:center;justify-content:space-between;width:100%;padding:13px 14px;border-radius:10px;background:none;border:none;cursor:pointer;font:600 16px var(--font-body);color:var(--ink);text-align:left;transition:background .15s}
.vd-mobile-nav-links button:hover,.vd-mobile-nav-links button.active{background:rgba(42,31,18,.06)}
.vd-mobile-nav-links button.active{color:var(--green)}
.vd-mobile-nav-arrow{font-size:14px;color:var(--ink-3)}
.vd-mobile-nav-actions{padding-top:10px;border-top:1px solid var(--line)}
.vd-mobile-nav-actions .vd-btn{width:100%;justify-content:center;padding:14px}
.vd-nav-auth .auth-name{color:var(--ink)}
.vd-nav-auth .auth-menu{background:#fff;border-color:var(--line-2)}
.vd-nav-auth .auth-menu button{color:var(--ink)}
.vd-nav-auth .auth-menu button:hover{background:var(--green-lt)}
.vd-nav-links button{color:var(--ink-2);transition:color .15s;padding:6px 0;border-bottom:2px solid transparent;background:none;border:none;cursor:pointer;font:14px var(--font-body);border-bottom:2px solid transparent}
.vd-nav-links button:hover{color:var(--ink)}
.vd-nav-links button.active{color:var(--ink);border-bottom-color:var(--green)}
.vd-nav-cta{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:var(--ink);color:var(--bg);border-radius:999px;border:none;cursor:pointer;font:600 13px var(--font-body);transition:transform .15s,box-shadow .15s}
.vd-nav-cta:hover{transform:translateY(-1px);box-shadow:0 10px 24px -10px rgba(0,0,0,.4)}

/* Buttons */
.vd-btn{display:inline-flex;align-items:center;gap:8px;padding:13px 22px;font:600 15px var(--font-body);border-radius:999px;cursor:pointer;border:none;transition:transform .15s,box-shadow .15s}
.vd-btn-p{background:var(--ink);color:var(--bg);box-shadow:0 4px 20px -8px rgba(0,0,0,.3)}
.vd-btn-p:hover{transform:translateY(-1px);box-shadow:0 12px 32px -10px rgba(0,0,0,.45)}
.vd-btn-e{background:var(--ember);color:#fff;box-shadow:0 4px 20px -8px rgba(217,98,30,.5)}
.vd-btn-e:hover{transform:translateY(-1px);box-shadow:0 12px 32px -10px rgba(217,98,30,.55)}
.vd-btn-g{background:transparent;color:var(--ink);border:1px solid var(--line-2)}
.vd-btn-g:hover{background:var(--bg-2);border-color:var(--ink)}
.vd-btn-gw{background:transparent;color:var(--bg);border:1px solid rgba(250,246,236,.3)}
.vd-btn-gw:hover{background:rgba(255,255,255,.1)}

/* Container */
.vd-con{max-width:1240px;margin:0 auto;padding:0 48px}
.vd-con-n{max-width:880px;margin:0 auto;padding:0 48px}

/* Eyebrow */
.vd-ey{display:inline-flex;align-items:center;gap:8px;font:700 11.5px var(--font-mono);letter-spacing:.16em;color:var(--green-dk);text-transform:uppercase}
.vd-ey .dot{width:7px;height:7px;border-radius:50%;background:var(--ember);animation:vd-p 2s ease-out infinite}
@keyframes vd-p{0%{box-shadow:0 0 0 0 rgba(217,98,30,.6)}70%{box-shadow:0 0 0 8px rgba(217,98,30,0)}100%{box-shadow:0 0 0 0 rgba(217,98,30,0)}}

/* Sections */
.vd-sec{padding:110px 0}
.vd-sec-dk{background:var(--bg-dark);color:var(--bg)}
.vd-sec-dk p{color:rgba(250,246,236,.72)}
.vd-sec-dk h1,.vd-sec-dk h2,.vd-sec-dk h3{color:var(--bg)}
.vd-sec-dk .vd-ey{color:var(--sand)}
.vd-sec-gr{background:var(--green-lt)}
.vd-sec-2{background:var(--bg-2)}

/* Chips */
.vd-chip{display:inline-flex;align-items:center;padding:5px 11px;background:var(--bg-2);border-radius:999px;font-size:12px;color:var(--ink-2);border:1px solid var(--line)}
.vd-chip-g{background:var(--green-lt);color:var(--green-dk);border-color:rgba(42,110,69,.2)}
.vd-chip-e{background:rgba(217,98,30,.08);color:var(--ember-dk);border-color:rgba(217,98,30,.25)}

/* Cards */
.vd-card{background:var(--bg);border:1px solid var(--line);border-radius:18px;padding:28px;transition:transform .18s,box-shadow .18s}
.vd-card:hover{transform:translateY(-3px);box-shadow:0 24px 50px -20px rgba(26,31,26,.18)}

/* Trust strip */
.vd-strip{background:var(--bg-dark);padding:20px 0;border-top:1px solid rgba(250,246,236,.1);border-bottom:1px solid rgba(250,246,236,.1);overflow:hidden}
.vd-strip-in{display:flex;align-items:center;gap:12px;max-width:1240px;margin:0 auto;padding:0 48px}
.vd-strip-lbl{font:700 11px var(--font-mono);letter-spacing:.16em;color:rgba(250,246,236,.4);flex-shrink:0}
.vd-strip-tr{flex:1;overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.vd-strip-rl{display:inline-flex;gap:48px;animation:vd-sc 50s linear infinite;white-space:nowrap;font:13px var(--font-mono);letter-spacing:.04em;color:rgba(250,246,236,.65)}
@keyframes vd-sc{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

/* Hero */
.vd-hero{position:relative;overflow:hidden;padding:60px 0 0;background:linear-gradient(180deg,#FAF6EC 0%,#F8EFDC 100%)}
.vd-hero-ey{display:inline-flex;align-items:center;gap:10px;padding:7px 14px 7px 10px;background:rgba(42,110,69,.1);border-radius:999px;border:1px solid rgba(42,110,69,.25);font-size:12.5px;color:var(--green-dk);font-weight:500;margin-bottom:28px}
.vd-hero-ey .dot{width:7px;height:7px;border-radius:50%;background:var(--green)}
.vd-hero h1{margin:0 0 26px;max-width:1100px}
.vd-hero h1 em{font-style:italic;font-weight:500;background:linear-gradient(135deg,var(--ember) 0%,var(--green) 80%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.vd-hero-lede{font-size:21px;line-height:1.5;color:var(--ink-2);max-width:640px;margin:0 0 30px}
.vd-hero-cta{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:26px}
.vd-hero-meta{display:flex;gap:28px;flex-wrap:wrap;font-size:13px;color:var(--ink-3)}
.vd-hero-meta span{display:inline-flex;align-items:center;gap:6px}
.vd-hero-meta i{width:6px;height:6px;border-radius:50%;background:var(--green);display:inline-block}

/* Hero image */
.vd-himg-w{max-width:1240px;margin:48px auto 0;padding:0 48px}
.vd-himg{position:relative;border-radius:24px;overflow:hidden;aspect-ratio:16/9;box-shadow:0 60px 120px -40px rgba(26,31,26,.45)}
.vd-himg img{width:100%;height:100%;object-fit:cover;display:block}
.vd-hud{position:absolute;padding:14px 18px;background:rgba(255,252,244,.92);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.5);border-radius:14px;box-shadow:0 20px 50px -20px rgba(0,0,0,.45);display:flex;flex-direction:column;gap:4px;animation:vd-fl .8s ease-out backwards}
@keyframes vd-fl{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
.vd-hud-ey{font:700 9.5px var(--font-mono);letter-spacing:.14em;color:var(--ink-3);text-transform:uppercase}
.vd-hud-val{font:800 24px var(--font-display);line-height:1;color:var(--ink);font-variant-numeric:tabular-nums}
.vd-hud-val .u{font-size:13px;font-weight:500;color:var(--ink-2);margin-left:4px}
.vd-hud-sub{font-size:11px;color:var(--ink-2)}
.vd-hud-tl{top:28px;left:28px;animation-delay:.4s}
.vd-hud-tr{top:28px;right:28px;animation-delay:.55s}
.vd-hud-bl{bottom:28px;left:28px;animation-delay:.7s}
.vd-hud-br{bottom:28px;right:28px;animation-delay:.85s}
.vd-hud-bar{width:120px;height:4px;background:rgba(26,31,26,.1);border-radius:4px;overflow:hidden;margin-top:4px}
.vd-hud-bar-fill{height:100%;background:var(--green);border-radius:4px}
.vd-hero-scroll{text-align:center;margin-top:36px;padding-bottom:40px;font:11px var(--font-mono);letter-spacing:.18em;color:var(--ink-3);text-transform:uppercase;animation:vd-bob 2.4s ease-in-out infinite}
@keyframes vd-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
.vd-hero-scroll::after{content:'↓';display:block;margin-top:6px;font-size:14px;color:var(--ember)}

/* Problem stats */
.vd-prob-grid{display:grid;grid-template-columns:repeat(3,1fr);max-width:1240px;margin:0 auto}
.vd-prob-stat{padding:36px 32px;border-right:1px solid var(--line)}
.vd-prob-stat:last-child{border-right:none}
.vd-pstat-val{font:900 72px var(--font-display);line-height:.92;color:var(--ember-dk);font-variant-numeric:tabular-nums;letter-spacing:-0.03em}
.vd-pstat-val .sm{font-size:.4em;font-weight:500;color:var(--ink-2);margin-left:4px}
.vd-pstat-lbl{margin-top:14px;font-size:16px;color:var(--ink-2);line-height:1.5;max-width:280px}
.vd-pstat-src{font:11px var(--font-mono);color:var(--ink-3);margin-top:16px;letter-spacing:.06em;text-transform:uppercase;padding-top:16px;border-top:1px solid var(--line)}

/* Cinematic */
.vd-cin-g{display:grid;grid-template-columns:1fr 1fr;gap:60px;max-width:1240px;margin:0 auto;padding:0 48px;align-items:center}
.vd-cin-img{border-radius:18px;overflow:hidden;box-shadow:0 40px 100px -20px rgba(0,0,0,.5);aspect-ratio:16/10}
.vd-cin-img img{width:100%;height:100%;object-fit:cover;display:block}
.vd-cin h2{font-size:clamp(34px,4.5vw,58px);color:var(--bg);line-height:1.05;margin-bottom:22px}
.vd-cin h2 em{font-style:italic;font-weight:500;background:linear-gradient(135deg,#FFE0B0,var(--ember));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.vd-cin-ey{color:var(--sand);font:700 12px var(--font-mono);letter-spacing:.16em;margin-bottom:18px;display:block}
.vd-cin p{color:rgba(250,246,236,.78);font-size:17px;line-height:1.6;margin-bottom:14px}
.vd-cin-q{margin-top:28px;padding-left:20px;border-left:2px solid var(--ember);font:italic 500 19px var(--font-display);color:rgba(250,246,236,.85);line-height:1.4}
.vd-cin-attr{margin-top:10px;font:11px var(--font-mono);letter-spacing:.10em;color:rgba(250,246,236,.5);text-transform:uppercase}

/* Level features */
.vd-lf{display:grid;grid-template-columns:1.3fr 1fr;max-width:1240px;margin:0 auto 24px;padding:0 48px;gap:60px;align-items:center}
.vd-lf:nth-child(even){grid-template-columns:1fr 1.3fr}
.vd-lf:nth-child(even) .vd-lf-img{order:-1}
.vd-lf-img{position:relative;border-radius:18px;overflow:hidden;aspect-ratio:4/3;box-shadow:0 30px 60px -25px rgba(26,31,26,.4);cursor:pointer}
.vd-lf-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s cubic-bezier(.2,.7,.3,1)}
.vd-lf:hover .vd-lf-img img{transform:scale(1.04)}
.vd-lf-badge{position:absolute;top:20px;left:20px;padding:6px 12px;background:rgba(255,252,244,.94);backdrop-filter:blur(10px);border-radius:999px;font:700 10.5px var(--font-mono);letter-spacing:.14em;color:var(--ink);box-shadow:0 4px 14px rgba(0,0,0,.15)}
.vd-lf-coords{position:absolute;bottom:20px;left:20px;font:11px var(--font-mono);color:rgba(255,255,255,.85);text-shadow:0 1px 4px rgba(0,0,0,.5);letter-spacing:.04em}
.vd-lf-body{padding:0 12px}
.vd-lf-num{font:700 11px var(--font-mono);color:var(--ember-dk);letter-spacing:.18em}
.vd-lf-body h3{margin:12px 0 10px;font-size:clamp(26px,3vw,40px)}
.vd-lf-loc{font-size:13px;color:var(--ink-3);margin-bottom:18px;font-family:var(--font-mono);letter-spacing:.04em}
.vd-lf-body p{font-size:15.5px;line-height:1.65;margin-bottom:14px}
.vd-lf-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:18px}
.vd-lf-cite{margin-top:20px;padding-top:20px;border-top:1px solid var(--line);font-size:13px;line-height:1.55;color:var(--ink-3);font-style:italic}

/* Mosaic */
.vd-mosaic{display:grid;grid-template-columns:repeat(12,1fr);grid-auto-rows:100px;max-width:1240px;margin:0 auto;padding:0 48px;gap:12px}
.vd-mc{position:relative;border-radius:14px;overflow:hidden;box-shadow:0 14px 30px -14px rgba(26,31,26,.25);transition:transform .25s cubic-bezier(.2,.7,.3,1);cursor:pointer}
.vd-mc:hover{transform:translateY(-3px)}
.vd-mc img{width:100%;height:100%;object-fit:cover;display:block}
.vd-mc-lbl{position:absolute;bottom:12px;left:14px;right:14px;color:#fff;font:700 17px var(--font-display);text-shadow:0 2px 8px rgba(0,0,0,.6);letter-spacing:-0.01em}
.vd-mc-lbl span{display:block;font:600 10px var(--font-mono);letter-spacing:.14em;color:rgba(255,255,255,.75);margin-bottom:4px}
.vd-mc.c1{grid-column:span 6;grid-row:span 3}
.vd-mc.c2{grid-column:span 6;grid-row:span 2}
.vd-mc.c3{grid-column:span 4;grid-row:span 2}
.vd-mc.c4{grid-column:span 4;grid-row:span 2}
.vd-mc.c5{grid-column:span 4;grid-row:span 3}

/* How it works */
.vd-how-g{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;max-width:1240px;margin:0 auto;padding:0 48px}
.vd-how-s{padding:34px 26px;background:var(--bg);border:1px solid var(--line);border-radius:18px;transition:transform .2s,border-color .2s,box-shadow .2s}
.vd-how-s:hover{transform:translateY(-4px);border-color:var(--green);box-shadow:0 30px 60px -25px rgba(42,110,69,.2)}
.vd-how-n{width:44px;height:44px;border-radius:50%;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;font:800 18px var(--font-display);margin-bottom:22px}

/* Number strip */
.vd-nstrip{background:linear-gradient(135deg,var(--ink) 0%,#0E0A05 100%);color:var(--bg);padding:80px 0;position:relative;overflow:hidden}
.vd-nstrip::before{content:'';position:absolute;top:-50%;right:-10%;width:600px;height:600px;background:radial-gradient(circle,rgba(217,98,30,.18),transparent 70%)}
.vd-nstrip-g{display:grid;grid-template-columns:repeat(4,1fr);max-width:1240px;margin:0 auto;padding:0 48px;position:relative;z-index:2}
.vd-ncell{padding:0 32px;border-right:1px solid rgba(250,246,236,.18)}
.vd-ncell:first-child{padding-left:0}
.vd-ncell:last-child{border-right:none;padding-right:0}
.vd-nval{font:800 60px var(--font-display);line-height:.95;color:var(--sand);letter-spacing:-0.02em;font-variant-numeric:tabular-nums;margin-bottom:8px}
.vd-nval .u{font-size:22px;color:rgba(250,246,236,.7);font-weight:500;margin-left:4px}
.vd-nlbl{font-size:14px;line-height:1.5;color:rgba(250,246,236,.7);max-width:240px}

/* Testimonials */
.vd-test-g{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:1240px;margin:0 auto;padding:0 48px}
.vd-test{padding:30px;background:var(--bg);border-radius:18px;box-shadow:0 14px 40px -20px rgba(26,31,26,.18);display:flex;flex-direction:column}
.vd-test-q{font:500 18px var(--font-display);line-height:1.4;color:var(--ink);margin:0 0 26px}
.vd-test-q::before{content:'\\201C';display:block;font:800 52px var(--font-display);line-height:.5;color:var(--green);margin-bottom:14px}
.vd-test-attr{margin-top:auto;padding-top:18px;border-top:1px solid var(--line);display:flex;align-items:center;gap:12px}
.vd-test-av{width:42px;height:42px;border-radius:50%;color:#fff;font:800 15px var(--font-display);display:flex;align-items:center;justify-content:center}
.vd-test-name{font-weight:600;font-size:14px;color:var(--ink)}
.vd-test-role{font-size:12px;color:var(--ink-3);margin-top:2px}

/* CTA section */
.vd-cta{padding:130px 0 110px;background:var(--bg-dark);color:var(--bg);text-align:center;position:relative;overflow:hidden}
.vd-cta::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(243,122,48,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(243,122,48,.04) 1px,transparent 1px);background-size:40px 40px;mask-image:radial-gradient(ellipse at center,#000 30%,transparent 70%)}
.vd-cta-in{max-width:760px;margin:0 auto;padding:0 48px;position:relative;z-index:2}
.vd-cta h2{color:var(--bg);margin-bottom:22px;font-size:clamp(38px,5vw,70px)}
.vd-cta h2 em{font-style:italic;font-weight:500;background:linear-gradient(135deg,#FFE0B0,var(--ember));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.vd-cta p{color:rgba(250,246,236,.75);font-size:18px;max-width:540px;margin:0 auto 32px;line-height:1.6}
.vd-cta-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}

/* Footer */
.vd-ft{padding:56px 48px 36px;background:var(--bg-dark);color:rgba(250,246,236,.75)}
.vd-ft-in{max-width:1240px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px}
.vd-ft-tag{font-size:14px;max-width:320px;line-height:1.6;color:rgba(250,246,236,.6);margin-top:10px}
.vd-ft h4{margin:0 0 14px;font:700 11px var(--font-mono);letter-spacing:.14em;color:rgba(250,246,236,.5);text-transform:uppercase}
.vd-ft ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
.vd-ft a,.vd-ft button{color:rgba(250,246,236,.75);text-decoration:none;font:14px var(--font-body);cursor:pointer;background:none;border:none;text-align:left;padding:0}
.vd-ft a:hover,.vd-ft button:hover{color:var(--bg)}
.vd-ft-bar{max-width:1240px;margin:48px auto 0;padding-top:18px;border-top:1px solid rgba(250,246,236,.10);display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font:12px var(--font-mono);color:rgba(250,246,236,.5)}

/* Inner pages */
.vd-ph{padding:80px 0 60px;background:linear-gradient(180deg,#FAF6EC 0%,#F2EBDC 100%)}
.vd-ph h1{margin:18px 0 22px;font-size:clamp(36px,5vw,68px);max-width:900px}

/* ── Responsive grid utilities (replace inline styles) ── */
.vd-2col-header{display:grid;grid-template-columns:320px 1fr;gap:80px;margin-bottom:44px;align-items:end}
.vd-2col-split{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start}
.vd-2col-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px}
.vd-3col-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.vd-4col-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:40px}
.vd-roadmap-row{display:grid;grid-template-columns:200px 1fr;gap:28px;padding-bottom:24px;margin-bottom:24px;border-bottom:1px solid var(--line)}

/* Investors */
.vd-qs-g{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:0;margin-top:48px;border:1px solid var(--line);border-radius:18px;overflow:hidden}
.vd-qs{padding:28px 32px;border-right:1px solid var(--line)}
.vd-qs:last-child{border-right:none}
.vd-qs-l{font:700 9.5px var(--font-mono);letter-spacing:.18em;color:var(--ink-3);text-transform:uppercase;margin-bottom:8px}
.vd-qs-v{font:800 40px var(--font-display);line-height:1;color:var(--ink);font-variant-numeric:tabular-nums;letter-spacing:-0.025em}
.vd-qs.hero .vd-qs-v{font-size:52px;color:var(--ember-dk)}
.vd-qs-s{font-size:12px;color:var(--ink-3);margin-top:6px;font-family:var(--font-mono)}

/* Inv TOC */
.vd-itoc{position:sticky;top:64px;z-index:40;background:rgba(250,246,236,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);overflow-x:auto}
.vd-itoc-in{max-width:1240px;margin:0 auto;padding:12px 48px;display:flex;gap:28px;white-space:nowrap}
.vd-itoc a{font:11px var(--font-mono);color:var(--ink-3);text-decoration:none;letter-spacing:.06em;cursor:pointer;background:none;border:none;padding:0;transition:color .15s;font-family:var(--font-mono)}
.vd-itoc a:hover{color:var(--ink)}

/* Inv block */
.vd-ib{padding:64px 0;border-bottom:1px solid var(--line)}
.vd-ib-h{display:grid;grid-template-columns:80px 1fr;gap:28px;margin-bottom:40px;align-items:start}
.vd-ib-n{font:800 48px var(--font-display);line-height:1;color:var(--ink-3);font-variant-numeric:tabular-nums;padding-top:4px}

/* Principles */
.vd-pr{display:grid;grid-template-columns:80px 1fr;gap:28px;padding:28px 0;border-bottom:1px solid var(--line)}
.vd-pr:last-child{border-bottom:none}
.vd-pr-n{font:700 13px var(--font-mono);letter-spacing:.12em;color:var(--ink-3);padding-top:4px}

/* Feature grid */
.vd-fg{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:44px}
.vd-fc{padding:26px;background:var(--bg);border:1px solid var(--line);border-radius:18px;transition:transform .18s,box-shadow .18s}
.vd-fc:hover{transform:translateY(-3px);box-shadow:0 24px 50px -20px rgba(26,31,26,.15)}
.vd-fc-ic{width:44px;height:44px;background:var(--green-lt);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:18px}
.vd-fc h3{margin-bottom:10px;font-size:20px}
.vd-fc p{font-size:14.5px;line-height:1.6}

/* Science cards */
.vd-sci-g{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.vd-sci{padding:24px;border:1px solid var(--line);border-radius:14px}
.vd-sci-h{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}
.vd-sci-s{font:700 10px var(--font-mono);padding:3px 8px;background:var(--green-lt);color:var(--green-dk);border-radius:4px;flex-shrink:0;letter-spacing:.06em}
.vd-sci h3{font-size:17px;margin:0}
.vd-sci p{font-size:13.5px;line-height:1.6}
.vd-sci cite{display:block;margin-top:10px;font:11px var(--font-mono);color:var(--ink-3);letter-spacing:.04em}

/* Reveal */
.vd-rv{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.4,0,.2,1),transform .7s cubic-bezier(.4,0,.2,1)}
.vd-rv.in{opacity:1;transform:none}

/* ── Tablet (≤900px) ── */
@media(max-width:900px){
  .vd-nav{padding:12px 20px;gap:16px;grid-template-columns:auto auto auto}
  .vd-nav-links{display:none}
  .vd-nav-cta{display:none}
  .vd-hamburger{display:flex}
  .vd-mobile-nav{display:block}
  .vd-con,.vd-con-n{padding:0 20px}
  .vd-2col-header{grid-template-columns:1fr;gap:20px;margin-bottom:28px}
  .vd-2col-split{grid-template-columns:1fr;gap:32px}
  .vd-2col-grid{grid-template-columns:1fr;gap:20px}
  .vd-3col-grid{grid-template-columns:1fr 1fr;gap:18px}
  .vd-4col-grid{grid-template-columns:1fr 1fr;gap:20px}
  .vd-roadmap-row{grid-template-columns:1fr;gap:12px}
  .vd-qs-g{grid-template-columns:1fr 1fr;border-radius:12px}
  .vd-qs{border-right:none;border-bottom:1px solid var(--line)}
  .vd-qs:nth-child(odd){border-right:1px solid var(--line)}
  .vd-qs:nth-last-child(-n+2){border-bottom:none}
  .vd-ph{padding:50px 0 36px}
  .vd-ph h1{font-size:clamp(28px,9vw,44px)}
  .vd-himg-w{padding:0 20px;margin-top:28px}
  .vd-hud-tl,.vd-hud-bl{display:none}
  .vd-cin-g,.vd-lf,.vd-lf:nth-child(even){grid-template-columns:1fr;gap:24px;padding:0 20px}
  .vd-lf:nth-child(even) .vd-lf-img{order:0}
  .vd-prob-grid,.vd-how-g,.vd-test-g{grid-template-columns:1fr;padding:0 20px}
  .vd-mosaic{padding:0 20px;grid-template-columns:repeat(6,1fr);grid-auto-rows:120px}
  .vd-mc.c1{grid-column:span 6;grid-row:span 3}
  .vd-mc.c2,.vd-mc.c3,.vd-mc.c4,.vd-mc.c5{grid-column:span 3;grid-row:span 2}
  .vd-nstrip-g{padding:0 20px;grid-template-columns:1fr 1fr;gap:24px}
  .vd-ncell{padding:0 0 20px;border-right:none;border-bottom:1px solid rgba(250,246,236,.18)}
  .vd-ft-in{grid-template-columns:1fr;gap:28px}
  .vd-ft{padding:40px 20px 24px}
  .vd-qs-g{grid-template-columns:1fr 1fr}
  .vd-fg,.vd-sci-g{grid-template-columns:1fr}
  .vd-sec{padding:60px 0}
  .vd-cta-in{padding:0 20px}
  .vd-hero{padding:40px 0 0}
}

/* ── Phone (≤600px) ── */
@media(max-width:600px){
  /* Nav */
  .vd-nav{display:flex;padding:10px 14px;gap:10px;align-items:center}
  .vd-nav>*:nth-child(2){flex:1} /* push auth+CTA to right */
  /* Grid utilities collapse to single column on phone */
  .vd-2col-header,.vd-2col-split,.vd-2col-grid,
  .vd-3col-grid,.vd-4col-grid,.vd-roadmap-row{grid-template-columns:1fr;gap:16px}
  .vd-logo-name{display:none}
  .vd-nav-cta{padding:8px 14px;font-size:13px;white-space:nowrap}
  .vd-nav-auth.auth-btn,.vd-nav-auth.auth-btn-signin{padding:7px 12px;font-size:12px}
  .vd-nav-auth .auth-name{display:none}

  /* Typography scales */
  .vd h1{font-size:clamp(34px,11vw,52px);line-height:1.05}
  .vd h2{font-size:clamp(26px,8vw,38px)}
  .vd h3{font-size:clamp(20px,6vw,28px)}

  /* Sections */
  .vd-sec{padding:48px 0}
  .vd-con,.vd-con-n{padding:0 16px}

  /* Hero */
  .vd-hero{padding:32px 0 0}
  .vd-himg-w{padding:0 14px;margin-top:24px}
  .vd-hero-ey{font-size:11px;padding:5px 10px}
  .vd-hero-btns{flex-direction:column;gap:10px;align-items:stretch}
  .vd-btn{width:100%;justify-content:center;min-height:52px;font-size:15px}
  .vd-hero-chips{flex-wrap:wrap;gap:6px}

  /* Mosaic — single column stacked cards */
  .vd-mosaic{grid-template-columns:1fr;grid-auto-rows:200px;gap:10px;padding:0 14px}
  .vd-mc.c1,.vd-mc.c2,.vd-mc.c3,.vd-mc.c4,.vd-mc.c5{grid-column:span 1;grid-row:span 1}

  /* Level feature sections */
  .vd-lf,.vd-lf:nth-child(even){grid-template-columns:1fr;gap:20px;padding:0 14px}
  .vd-lf-img{aspect-ratio:16/9}
  .vd-lf-body{padding:0}
  .vd-lf-body p{font-size:14px}

  /* Grids */
  .vd-prob-grid,.vd-how-g,.vd-test-g{grid-template-columns:1fr;padding:0 14px;gap:14px}
  .vd-qs-g,.vd-nstrip-g{grid-template-columns:1fr}
  .vd-nstrip-g{padding:0 14px}
  .vd-fg,.vd-sci-g{grid-template-columns:1fr}
  .vd-cin-g{grid-template-columns:1fr;padding:0 14px}

  /* CTA */
  .vd-cta-in{padding:0 14px}
  .vd-cta-btns{flex-direction:column;gap:10px;align-items:stretch}

  /* Footer */
  .vd-ft{padding:36px 14px 20px}
  .vd-ft-in{grid-template-columns:1fr;gap:24px}
}
`;

const IMGS = {
  schoolyard: '/screen-forest.png',
  desert:  '/screen-desert.png',
  coastal: '/screen-coastal.png',
  urban:   '/screen-urban.png',
  forest:  '/screen-forest.png',
  planet:  '/screen-planet.png',
};

function useCSS() {
  useEffect(() => {
    const id = 'vd-css';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id; el.textContent = SITE_CSS;
      document.head.appendChild(el);
    }
    document.body.classList.add('lp-active');
    document.documentElement.classList.add('lp-active');

    // Start opening music on first interaction (autoplay policy requires user gesture)
    const startMusic = () => { playOpeningMusic(); document.removeEventListener('click', startMusic); document.removeEventListener('touchstart', startMusic); };
    document.addEventListener('click', startMusic);
    document.addEventListener('touchstart', startMusic);

    return () => {
      document.getElementById(id)?.remove();
      document.body.classList.remove('lp-active');
      document.documentElement.classList.remove('lp-active');
      document.removeEventListener('click', startMusic);
      document.removeEventListener('touchstart', startMusic);
      stopOpeningMusic(0.8);
    };
  }, []);
}

function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      e => e.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); obs.unobserve(x.target); } }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.vd-rv').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  });
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ page, setPage, onPlay, onOpenAuth, onOpenProfile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [['home','Overview'],['product','Product'],['impact','Mission'],['investors','Investors']];

  function go(p) { setPage(p); setMenuOpen(false); }

  return (
    <>
      <nav className="vd-nav">
        <button className="vd-logo" onClick={() => go('home')}>
          <div className="vd-logo-mark">V</div>
          <span className="vd-logo-name">Verdant</span>
        </button>
        <div className="vd-nav-links">
          {links.map(([p,l]) => (
            <button key={p} className={page===p?'active':''} onClick={() => go(p)}>{l}</button>
          ))}
        </div>
        <div className="vd-nav-right">
          <AuthButton className="vd-nav-auth" onOpenAuth={onOpenAuth} onOpenProfile={onOpenProfile} />
          <button className="vd-nav-cta" onClick={() => onPlay('schoolyard')}>Play the demo →</button>
          <button className="vd-hamburger" onClick={() => setMenuOpen(o=>!o)} aria-label="Menu">
            <span className={menuOpen ? 'open' : ''}/>
            <span className={menuOpen ? 'open' : ''}/>
            <span className={menuOpen ? 'open' : ''}/>
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <div className="vd-mobile-nav">
          <div className="vd-mobile-nav-links">
            {links.map(([p,l]) => (
              <button key={p} className={page===p?'active':''} onClick={() => go(p)}>
                {l}
                <span className="vd-mobile-nav-arrow">→</span>
              </button>
            ))}
          </div>
          <div className="vd-mobile-nav-actions">
            <button className="vd-btn vd-btn-p" onClick={() => { onPlay('schoolyard'); setMenuOpen(false); }}>
              Play the demo →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ setPage, onPlay }) {
  return (
    <footer className="vd-ft">
      <div className="vd-ft-in">
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div className="vd-logo-mark">V</div>
            <span className="vd-logo-name" style={{color:'var(--bg)'}}>Verdant</span>
          </div>
          <p className="vd-ft-tag">An ecological simulation game for the generation that has to fix this.</p>
        </div>
        <div>
          <h4>Product</h4>
          <ul>
            <li><button onClick={() => setPage('product')}>Product tour</button></li>
            <li><button onClick={() => onPlay('desert')}>Play the demo</button></li>
          </ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><button onClick={() => setPage('impact')}>Our mission</button></li>
            <li><button onClick={() => setPage('investors')}>For investors</button></li>
          </ul>
        </div>
        <div>
          <h4>Connect</h4>
          <ul>
            <li><a href="mailto:hello@verdant.game">hello@verdant.game</a></li>
            <li><a href="mailto:invest@verdant.game">invest@verdant.game</a></li>
          </ul>
        </div>
      </div>
      <div className="vd-ft-bar">
        <span>VERDANT · v0.5 DEMO · 2026</span>
        <span>NOT FOR PUBLIC RELEASE</span>
      </div>
    </footer>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function Home({ onPlay, setPage }) {
  const LEVELS = [
    {id:'schoolyard', badge:'STARTER · SCHOOLYARD MEADOW', coords:'A PATCH OF GROUND NEAR YOU', num:'00', name:'Schoolyard Meadow', loc:'YOUR FIRST WILD PATCH · AGES 8+', p:"The perfect place to begin. Ranger Maya guides young players through turning a bare, trampled corner of a community park into a buzzing wildlife meadow. Learn the golden rule of restoration — wildflowers first, then bushes, then trees — with friendly facts, an Eco-Dex of concepts, and a quick quiz at the end. Learn Mode built in.", chips:[['g','Ages 8+'],['g','Learn Mode'],['g','Pollinators & ponds']], cite:"Schools and parks worldwide are rewilding corners exactly like this — joined together they form wildlife corridors across whole cities."},
    {id:'desert', badge:'LEVEL 01 · DESERT BLOOM', coords:'N 14°47′ E 1°22′ · WADI AL-BAYDA', num:'01', name:'Desert Bloom', loc:'SAHEL · BIOME RECLAMATION', p:"Reclaim 14 acres of degraded farmland before the dunes claim it. The mechanic: ecological succession. Plant native grass first, build stone bunds, then drought shrubs, then agroforestry trees. Skip a step and watch your trees die in the first dry year.", chips:[['g','Succession'],['g','Water retention'],['g','Half-moon bunds']], cite:"Niger's Maradi region — 200 million trees regenerated since 1984 through the exact techniques in this level."},
    {id:'coastal', badge:'LEVEL 02 · COASTAL CRISIS', coords:'N 4°25′ E 7°10′ · BONNY ESTUARY', num:'02', name:'Coastal Crisis', loc:'NIGER DELTA · MANGROVE RESTORATION', p:"A pipeline ruptured 9,000 barrels last week. Untreated oil tiles spread to adjacent tidal flats every year unless you boom them off and dispatch skim platforms. Then rebuild the mangrove curtain that protects 800 km of coast.", chips:[['g','Mangroves'],['g','Containment booms'],['e','Active spreading hazard']], cite:"Vietnam's Mekong Delta — 28,000 ha mangrove restored 2008–2020. Storm damage in protected villages fell 40%."},
    {id:'urban', badge:'LEVEL 03 · URBAN HEAT TRAP', coords:'N 24°51′ E 67°00′ · SADDAR · KARACHI', num:'03', name:'Urban Heat Trap', loc:'KARACHI · COOLING THE CITY', p:"47°C heat. 6,000 residents. 1,200 heat-related ER visits a week. Green-roof modifiers convert any paved tile into one that can host street trees — exactly how tropical cities are retrofitting cool corridors.", chips:[['g','Green roofs'],['g','Cool pavement'],['g','Rain gardens']], cite:"Medellín planted 8,300 trees on 30 corridors and dropped city temperature 2°C in 3 years."},
    {id:'forest', badge:'LEVEL 04 · FOREST FRONTLINE', coords:'S 2°35′ E 113°50′ · SEBANGAU', num:'04', name:'Forest Frontline', loc:'BORNEO · AGROFORESTRY TRANSITION', p:"You hold the line where slash-and-burn meets the old forest. Burning tiles jump to adjacent canopy each year unless you cut firebreaks. Then convert the front to cocoa shade plots so the farmers stay solvent.", chips:[['g','Agroforestry'],['g','Cocoa premium'],['e','Active fire hazard']], cite:"Costa Rica reforested 50% of its land area between 1987 and 2018 via Payment for Ecosystem Services."},
    {id:'planet', badge:'LEVEL 05 · PLANET B', coords:'RA 19h02m DEC +39°16′ · KEPLER-442b', num:'05', name:'Planet B', loc:'KEPLER-442b · TERRAFORMING', p:"Surface: dust and salt. Atmosphere: 4% O₂. You can't skip stages on a dead planet. Microbial mats first, then lichen colonies, then biodomes, then dome-trees. Cross the irreversibility threshold and the biome runs itself.", chips:[['g','Synthetic ecology'],['g','O₂ thresholds'],['g','Biodomes']], cite:"Biosphere 2 closure experiments (1991–1994) proved synthetic biomes self-regulate above 2 acres."},
  ];

  return (
    <>
      {/* Hero */}
      <section className="vd-hero">
        <div className="vd-con">
          <div className="vd-hero-ey"><span className="dot"/> Pre-seed · Demo v0.6 live · 6 playable levels</div>
          <h1>Restore the planet,<br/><em>one biome at a time.</em></h1>
          <p className="vd-hero-lede">Verdant is an ecological simulation where playing is learning. Six levels, from a kid-friendly meadow to terraforming Mars. Real restoration playbooks. Built with ecologists for the generation that has to fix this.</p>
          <div className="vd-hero-cta">
            <button className="vd-btn vd-btn-p" onClick={() => onPlay('schoolyard')}>Play the demo →</button>
            <button className="vd-btn vd-btn-g" onClick={() => setPage('investors')}>For investors</button>
          </div>
          <div className="vd-hero-meta">
            <span><i/> No download · runs in any browser</span>
            <span><i/> 25 minutes per mission</span>
            <span><i/> Ages 8+ · Learn Mode</span>
          </div>
        </div>
        <div className="vd-himg-w">
          <div className="vd-himg">
            <img src={IMGS.desert} alt="Desert Bloom"/>
            <div className="vd-hud vd-hud-tl">
              <div className="vd-hud-ey">LEVEL 01 · YEAR 17 / 25</div>
              <div className="vd-hud-val">Wadi al-Bayda</div>
              <div className="vd-hud-sub">N 14°47′ · E 1°22′ · Sahel corridor</div>
            </div>
            <div className="vd-hud vd-hud-tr">
              <div className="vd-hud-ey">VEGETATION COVER</div>
              <div className="vd-hud-val">62<span className="u">%</span></div>
              <div className="vd-hud-bar"><div className="vd-hud-bar-fill" style={{width:'62%'}}/></div>
            </div>
            <div className="vd-hud vd-hud-bl">
              <div className="vd-hud-ey">AT CORRIDOR SCALE · 12K ACRES</div>
              <div className="vd-hud-val">1,240<span className="u">tCO₂/yr</span></div>
              <div className="vd-hud-sub">+ 240 people food-secure</div>
            </div>
            <div className="vd-hud vd-hud-br">
              <div className="vd-hud-ey">SPECIES RETURNED</div>
              <div className="vd-hud-val">14</div>
              <div className="vd-hud-sub">fennec fox · sahel sparrow · dorcas gazelle</div>
            </div>
          </div>
        </div>
        <div className="vd-hero-scroll">Scroll to explore</div>
      </section>

      {/* Trust strip */}
      <div className="vd-strip">
        <div className="vd-strip-in">
          <span className="vd-strip-lbl">Grounded in data from</span>
          <div className="vd-strip-tr">
            <div className="vd-strip-rl">
              {['IUCN RED LIST','·','NASA EARTH DATA','·','FAO STATISTICS','·','UNEP','·','WORLD BANK CLIMATE','·','GBIF','·','WMO BULLETIN','·','ESA SENTINEL-2','·','IUCN RED LIST','·','NASA EARTH DATA','·','FAO STATISTICS','·','UNEP','·','WORLD BANK CLIMATE','·','GBIF','·','WMO BULLETIN','·','ESA SENTINEL-2','·'].map((s,i)=><span key={i}>{s}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Problem */}
      <section className="vd-sec">
        <div className="vd-con" style={{textAlign:'center',marginBottom:60}}>
          <div className="vd-ey vd-rv"><span className="dot"/> THE PROBLEM</div>
          <h2 className="vd-rv" style={{marginTop:16,fontSize:'clamp(36px,5vw,70px)',maxWidth:1000,marginLeft:'auto',marginRight:'auto'}}>
            Climate education is <span style={{textDecoration:'line-through',textDecorationColor:'var(--ember)',textDecorationThickness:6}}>broken</span>. Most curricula tell you the world is on fire and then move <em style={{fontStyle:'italic',color:'var(--ember)'}}>to the next chapter.</em>
          </h2>
        </div>
        <div className="vd-prob-grid vd-rv">
          {[['12','M ha','primary forest lost globally in 2024 alone.','Global Forest Watch · 2024'],['3.2','B people','directly affected by land degradation worldwide.','UNCCD · 2023'],['71','% of Gen Z','report climate anxiety. Existing media is doom-flavoured.','Lancet Planetary Health · 2024']].map(([n,u,l,s])=>(
            <div key={n} className="vd-prob-stat">
              <div className="vd-pstat-val">{n}<span className="sm">{u}</span></div>
              <div className="vd-pstat-lbl">{l}</div>
              <div className="vd-pstat-src">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cinematic */}
      <section className="vd-sec vd-sec-dk">
        <div className="vd-cin-g">
          <div className="vd-cin-img vd-rv"><img src={IMGS.forest} alt="Forest Frontline"/></div>
          <div className="vd-rv" style={{transitionDelay:'.12s'}}>
            <span className="vd-cin-ey">THE PRODUCT</span>
            <h2 className="vd-cin">A real game.<br/>Real science.<br/><em>Real consequences.</em></h2>
            <p className="vd-cin">Every mechanic in Verdant mirrors a real ecological principle. Trees won't survive on bare sand without water — so you build half-moon bunds first, exactly like Sahel farmers regenerating 200 million trees.</p>
            <p className="vd-cin">Burning tiles jump to adjacent canopy unless you cut firebreaks. Oil slicks spread unless boomed. The frustration is the lesson.</p>
            <div className="vd-cin-q">The first game I've seen that lets kids feel what regenerative agriculture actually means — not as a slogan, but as a sequence of decisions.
              <div className="vd-cin-attr">DR. ADAEZE EBOH · MARINE BIOLOGIST · ADVISOR</div>
            </div>
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="vd-sec" style={{paddingBottom:60}}>
        <div className="vd-con">
          <div className="vd-2col-header" style={{marginBottom:56}}>
          <div className="vd-rv">
            <div className="vd-ey"><span className="dot"/> STARTER + 5 BIOMES</div>
            <h2 style={{marginTop:16}}>One playbook per biome. <em style={{fontStyle:'italic',background:'linear-gradient(135deg,var(--green),var(--ember))',WebkitBackgroundClip:'text',backgroundClip:'text',WebkitTextFillColor:'transparent'}}>All real,</em> all replicable.</h2>
          </div>
          <p className="vd-rv" style={{fontSize:17,lineHeight:1.65}}>Each level is a different ecological crisis and a different family of solutions. Together they make a literacy curriculum.</p>
          </div>
        {LEVELS.map((l,i)=>(
          <div key={l.id} className="vd-lf vd-rv" style={{transitionDelay:`${i*.07}s`}}>
            <div className="vd-lf-img" onClick={()=>onPlay(l.id)}>
              <img src={IMGS[l.id]} alt={l.name}/>
              <div className="vd-lf-badge" style={l.id==='planet'?{background:'rgba(20,14,8,.85)',color:'var(--bg)'}:{}}>{l.badge}</div>
              <div className="vd-lf-coords">{l.coords}</div>
            </div>
            <div className="vd-lf-body">
              <div className="vd-lf-num">{l.num} / 05</div>
              <h3>{l.name}</h3>
              <div className="vd-lf-loc">{l.loc}</div>
              <p>{l.p}</p>
              <div className="vd-lf-chips">{l.chips.map(([t,s])=><span key={s} className={`vd-chip vd-chip-${t==='g'?'g':'e'}`}>{s}</span>)}</div>
              <div className="vd-lf-cite"><b style={{color:'var(--ink)'}}>Real-world parallel.</b> {l.cite}</div>
            </div>
          </div>
        ))}
        </div>
      </section>

      {/* Mosaic */}
      <section className="vd-sec vd-sec-2" style={{padding:'100px 0'}}>
        <div className="vd-con" style={{textAlign:'center',marginBottom:52}}>
          <div className="vd-ey vd-rv"><span className="dot"/> A WORLD WORTH RETURNING TO</div>
          <h2 className="vd-rv" style={{marginTop:16,maxWidth:720,marginLeft:'auto',marginRight:'auto'}}>From dust to canopy. From slick to mangrove. <em style={{fontStyle:'italic'}}>From dead rock to breathing biome.</em></h2>
        </div>
        <div className="vd-mosaic vd-rv">
          {[['desert','c1','LEVEL 01 · 12,000 ACRES','Desert Bloom'],['coastal','c2','LEVEL 02 · 28,000 HA','Coastal Crisis'],['urban','c3','LEVEL 03 · 5,000 ACRES','Urban Heat Trap'],['forest','c4','LEVEL 04 · 90,000 HA','Forest Frontline'],['planet','c5','LEVEL 05 · 50M ACRES','Planet B']].map(([id,c,s,name])=>(
            <div key={id} className={`vd-mc ${c}`} onClick={()=>onPlay(id)}>
              <img src={IMGS[id]} alt={name}/>
              <div className="vd-mc-lbl"><span>{s}</span>{name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section className="vd-sec">
        <div className="vd-con" style={{textAlign:'center',marginBottom:60}}>
          <div className="vd-ey vd-rv"><span className="dot"/> HOW IT WORKS</div>
          <h2 className="vd-rv" style={{marginTop:14,maxWidth:640,marginLeft:'auto',marginRight:'auto'}}>From briefing to corridor scale, in 25 minutes.</h2>
        </div>
        <div className="vd-how-g">
          {[['1','Brief',"Each mission opens with real-world stakes: a 12-acre patch of Sahel, a delta after a 9,000-barrel spill, a Karachi block during a 47°C heat wave. The stakes are concrete because the places are real."],['2','Decide',"Place actions on tiles — native grass, shrubs, ponds, bunds, agroforestry, firebreaks. Resources are tight. Skip a stage and you'll watch your trees die."],['3','See it scale',"A live impact panel extrapolates your per-acre decisions to corridor scale: tCO₂ sequestered, people food-secure, hectares protected. The win screen always cites the real-world parallel."]].map(([n,h,p],i)=>(
            <div key={n} className="vd-how-s vd-rv" style={{transitionDelay:`${i*.10}s`}}>
              <div className="vd-how-n">{n}</div>
              <h3>{h}</h3>
              <p style={{fontSize:15,lineHeight:1.6}}>{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Number strip */}
      <section className="vd-nstrip">
        <div className="vd-nstrip-g">
          {[['5','biomes','From the Sahel to a Kepler exoplanet, each grounded in real ecology.'],['25','min','Time to play one mission, end to end. Twenty-five years of decisions.'],['35','species','Calibrated to IUCN Red List habitat thresholds. They return as your biome heals.'],['0','downloads','Runs in any browser. No app store. No install. Designed for Chromebooks.']].map(([n,u,l])=>(
            <div key={n} className="vd-ncell">
              <div className="vd-nval">{n}<span className="u">{u}</span></div>
              <div className="vd-nlbl">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="vd-sec vd-sec-gr">
        <div className="vd-con" style={{textAlign:'center',marginBottom:60}}>
          <div className="vd-ey vd-rv"><span className="dot"/> EARLY FEEDBACK</div>
          <h2 className="vd-rv" style={{marginTop:16}}>What playtesters and advisors are saying.</h2>
        </div>
        <div className="vd-test-g">
          {[{q:"I watched my eighth-grader scream when his trees died from a missed bund. He hasn't cared this much about a worksheet in his life.",name:'Jennifer M.',role:'7th-grade science teacher · pilot district',av:'JM',c:'linear-gradient(135deg,var(--green),var(--ember))'},
            {q:"Finally a sim where the ecology isn't decoration. The succession rules, the irrigation field — these are the playbooks I trained students on in the Maradi region.",name:'Dr. Sahel Almami',role:'Field ecologist · advisor',av:'SA',c:'linear-gradient(135deg,var(--green),var(--green-dk))'},
            {q:"We've been waiting for a climate-ed product our ESG cohort would actually finish. The 25-minute mission length is exactly right for an onboarding module.",name:'Chen R.',role:'Director of Learning · enterprise pilot',av:'CR',c:'linear-gradient(135deg,var(--ember),var(--ember-dk))'}
          ].map((t,i)=>(
            <div key={i} className="vd-test vd-rv" style={{transitionDelay:`${i*.10}s`}}>
              <p className="vd-test-q">{t.q}</p>
              <div className="vd-test-attr">
                <div className="vd-test-av" style={{background:t.c}}>{t.av}</div>
                <div><div className="vd-test-name">{t.name}</div><div className="vd-test-role">{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="vd-cta">
        <div className="vd-cta-in">
          <h2>Five biomes. Twenty-five minutes each.<br/><em>Try one now.</em></h2>
          <p>The demo runs in any browser. No download, no signup.</p>
          <div className="vd-cta-btns">
            <button className="vd-btn vd-btn-e" onClick={()=>onPlay('desert')}>Play the demo →</button>
            <button className="vd-btn vd-btn-gw" onClick={()=>setPage('investors')}>For investors</button>
          </div>
        </div>
      </section>
    </>
  );
}

// ── PRODUCT ───────────────────────────────────────────────────────────────────
function Product({ onPlay }) {
  return (
    <>
      <section className="vd-ph">
        <div className="vd-con">
          <div className="vd-ey vd-rv"><span className="dot"/> PRODUCT TOUR</div>
          <h1 className="vd-rv">Five biomes. One coherent simulation underneath.</h1>
          <p className="vd-rv" style={{fontSize:19,lineHeight:1.6,maxWidth:640,marginTop:18,color:'var(--ink-2)'}}>Every level reskins the same engine — the same tile roles, the same resource physics, the same time loop — and reshapes it around a real ecological crisis.</p>
        </div>
      </section>

      <section className="vd-sec" style={{paddingTop:60}}>
        <div className="vd-con">
          <div className="vd-2col-header">
            <div className="vd-rv">
              <div className="vd-ey"><span className="dot"/> SYSTEMS</div>
              <h2 style={{marginTop:14}}>What's under the hood.</h2>
            </div>
            <p className="vd-rv" style={{fontSize:17,lineHeight:1.65}}>Every visual element is wired into an ecological rule. No decorative graphics — if a tree sways, it's running a deterministic loop over a real biodiversity index.</p>
          </div>
          <div className="vd-fg">
            {[{i:'📈',h:'Live time-series chart',p:'Vegetation, hydration, and biodiversity tracked year-over-year. Players see their decisions translate into a curve, the same way ecologists do.'},
              {i:'💧',h:'Irrigation pulse field',p:'Water sources project a 3-tile influence ring via BFS. The pulse animation shows the field your tile is currently inside.'},
              {i:'🌍',h:'Corridor-scale projections',p:'A live impact panel extrapolates per-acre actions to corridor scale: 12,000 acres, 90,000 hectares, 50M planetary acres.'},
              {i:'🦊',h:'Emergent wildlife',p:'Five-to-seven species per level spawn when biodiversity crosses each threshold. Keyed to real counterparts — fennec fox at 32%, scimitar oryx at 72%.'},
              {i:'🔬',h:'Data overlays',p:'Toggle soil hydration, heat index, or biodiversity to see your map through different scientific lenses.'},
              {i:'📡',h:'Field intel ticker',p:'A scrolling rail of real-world news: WMO bulletins, FAO statistics, mongabay reports, local elder quotes.'},
            ].map((f,i)=>(
              <div key={i} className="vd-fc vd-rv" style={{transitionDelay:`${i*.07}s`}}>
                <div className="vd-fc-ic">{f.i}</div>
                <h3>{f.h}</h3>
                <p>{f.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="vd-sec vd-sec-2">
        <div className="vd-con">
          <div style={{marginBottom:44}}>
            <div className="vd-ey vd-rv"><span className="dot"/> SCIENCE BASIS</div>
            <h2 className="vd-rv" style={{marginTop:14,maxWidth:620}}>Every mechanic, every number, has a citation.</h2>
          </div>
          <div className="vd-sci-g">
            {[{l:'01',h:'Half-moon bunds & grass succession',p:'Half-moon bunds increase soil moisture 30–40%, enabling native grass establishment. Grass roots fix 0.4–1.2 t/ha/yr organic carbon.',c:'Reij et al., IFPRI 2009 · Fatondji et al., Agronomy 2012'},
              {l:'02',h:'Mangrove coastal resilience',p:'A 100m mangrove belt reduces wave height 66%. Each hectare stores 100–200 tCO₂.',c:'Spalding et al., Estuarine Science 2014 · Hamilton & Friess, Nature CC 2018'},
              {l:'03',h:'Urban heat island mitigation',p:'Green roofs reduce ambient temperatures 1–4°C. Street trees provide 8–12°C surface cooling to paved areas underneath.',c:'Santamouris, Solar Energy 2014 · Bowler et al., Landscape & Urban Planning 2010'},
              {l:'04',h:'Agroforestry carbon & fire',p:'Cocoa agroforestry stores 20–50 tCO₂/ha — 10× monoculture. 10m firebreaks reduce fire escape probability 78%.',c:'Norgrove & Hauser, Agroforestry Systems 2012 · Cochrane, Science 2003'},
              {l:'05',h:'Biosphere self-regulation',p:'Biosphere 2 demonstrated closed-system self-regulation above 0.8 ha. Microbial mats fix nitrogen before macroflora can establish.',c:'Marino & Odum, Ecological Engineering 1999'},
              {l:'All',h:'Ecological index (E = 0.28H + 0.30V + 0.22T + 0.20B)',p:'Weighting informed by IPCC AR6 land degradation drivers. Vegetation cover and soil hydration are primary restoration indicators.',c:'IPCC AR6 WG2 Ch.5 · Oriahki et al., JETE 2025'},
            ].map((s,i)=>(
              <div key={i} className="vd-sci vd-rv" style={{transitionDelay:`${i*.07}s`}}>
                <div className="vd-sci-h"><h3>{s.h}</h3><div className="vd-sci-s">L{s.l}</div></div>
                <p>{s.p}</p>
                <cite>{s.c}</cite>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="vd-cta">
        <div className="vd-cta-in">
          <h2>The simulation is live.<br/><em>Try it now.</em></h2>
          <p>Five levels, any browser, no download.</p>
          <div className="vd-cta-btns"><button className="vd-btn vd-btn-e" onClick={()=>onPlay('desert')}>Play Desert Bloom →</button></div>
        </div>
      </section>
    </>
  );
}

// ── MISSION / IMPACT ──────────────────────────────────────────────────────────
function Impact({ onPlay }) {
  return (
    <>
      <section className="vd-ph">
        <div className="vd-con">
          <div className="vd-ey vd-rv"><span className="dot"/> WHY VERDANT EXISTS</div>
          <h1 className="vd-rv">The climate generation will inherit the consequences. They deserve more than <em style={{fontStyle:'italic',color:'var(--ember)'}}>doom-scrolling.</em></h1>
          <p className="vd-rv" style={{fontSize:20,lineHeight:1.6,maxWidth:720,marginTop:22,color:'var(--ink-2)'}}>Verdant is built on a simple premise: agency is teachable, and games are how it's taught best. We are not a serious-game project bolted onto a curriculum. We are a serious game, designed by ecologists, where the win condition <em>is</em> the curriculum.</p>
        </div>
      </section>

      <section className="vd-sec">
        <div className="vd-con-n">
          <div className="vd-ey vd-rv"><span className="dot"/> OUR PRINCIPLES</div>
          <h2 className="vd-rv" style={{marginTop:14,maxWidth:660}}>Four commitments we won't compromise on.</h2>
          <div style={{marginTop:48}}>
            {[{n:'01',h:"Scientific honesty over fun.",p:"When ecology and game-feel disagree, ecology wins. If trees don't survive on bare sand in real life, they don't survive in Verdant. The frustration is the lesson."},
              {n:'02',h:"Hope as a system property.",p:"Every level ends with a working biome and a real-world parallel. The point is not that the player feels good — it's that they leave with proof that restoration works at scale."},
              {n:'03',h:"Locally specific, globally legible.",p:'Every level is grounded in a real place: Wadi al-Bayda, Bonny estuary, Saddar, Sebangau, Kepler-442b. We use real names and coordinates because generic "save the planet" rhetoric is precisely what\'s failing.'},
              {n:'04',h:"Free at the point of learning.",p:"The browser demo will stay free for individual players forever. Our business model rests on schools, institutions, and corporate ESG programs — not on children's screen time."},
            ].map((p,i)=>(
              <div key={p.n} className="vd-pr vd-rv" style={{transitionDelay:`${i*.10}s`}}>
                <div className="vd-pr-n">{p.n}</div>
                <div><h3>{p.h}</h3><p style={{marginTop:8,fontSize:16}}>{p.p}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="vd-sec vd-sec-dk">
        <div className="vd-con">
          <div className="vd-ey vd-rv"><span className="dot"/> THE SCALE OF THE PROBLEM</div>
          <h2 className="vd-rv" style={{marginTop:14,maxWidth:600}}>The numbers that make this urgent.</h2>
          <div className="vd-4col-grid" style={{marginTop:52}}>
            {[['1.5B','ha','degraded land globally needing restoration (FAO 2023)'],['200M','trees',"regenerated in Niger's Sahel via FMNR since 1984 — proof it works"],['$5.6T','yr','estimated annual cost of land degradation (IPBES 2023)'],['71%','Gen Z','climate-anxious — yet almost none have agency tools (Lancet 2024)']].map(([n,u,l],i)=>(
              <div key={i} className="vd-rv" style={{paddingTop:16,borderTop:'1px solid rgba(250,246,236,.14)',transitionDelay:`${i*.08}s`}}>
                <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:48,lineHeight:.95,color:'var(--sand)',fontVariantNumeric:'tabular-nums',letterSpacing:'-0.02em',marginBottom:8}}>{n}<span style={{fontSize:22,color:'rgba(250,246,236,.7)',fontWeight:500,marginLeft:4}}>{u}</span></div>
                <div style={{fontSize:13.5,lineHeight:1.5,color:'rgba(250,246,236,.65)',maxWidth:220}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="vd-cta">
        <div className="vd-cta-in">
          <h2>Play it. See what agency<br/><em>actually feels like.</em></h2>
          <p>The demo is free, no download required.</p>
          <div className="vd-cta-btns"><button className="vd-btn vd-btn-e" onClick={()=>onPlay('desert')}>Play the demo →</button></div>
        </div>
      </section>
    </>
  );
}

// ── INVESTORS ─────────────────────────────────────────────────────────────────
function Investors({ onPlay }) {
  const BLOCKS = [
    {id:'inv-1',n:'01',h:'The problem we solve.',body:(
      <div className="vd-3col-grid">
        {[{ey:'SCHOOLS',h:'26 U.S. states',p:'have proposed or enacted K-12 climate-education requirements since 2022. Teachers lack engaging curriculum; districts have budget but no products.',s:'NCSE · 2024'},
          {ey:'CORPORATES',h:'92% of Fortune 500',p:'have climate commitments. Most are now adding mandatory employee sustainability training — a market expanding 38% YoY in 2025.',s:'Deloitte Climate Survey · 2025'},
          {ey:'MARKET',h:'$4B/yr',p:'spent on corporate climate training annually in the U.S. alone. 74% of procurement managers say current products are too passive to drive behaviour change.',s:'Brandon Hall Group · 2025'},
        ].map((c,i)=>(
          <div key={i} className="vd-card">
            <div style={{fontFamily:'var(--font-mono)',fontSize:10.5,fontWeight:700,letterSpacing:'.14em',color:'var(--ink-3)',marginBottom:8}}>{c.ey}</div>
            <h3 style={{marginBottom:10}}>{c.h}</h3>
            <p style={{fontSize:14}}>{c.p}</p>
            <div style={{marginTop:12,fontFamily:'var(--font-mono)',fontSize:10.5,color:'var(--ink-3)',letterSpacing:'.06em'}}>{c.s}</div>
          </div>
        ))}
      </div>
    )},
    {id:'inv-2',n:'02',h:'Our solution.',body:(
      <div className="vd-2col-split">
        <div>
          <p style={{fontSize:17,lineHeight:1.7,marginBottom:18}}>Verdant is a browser-based ecological simulation game. Five levels, each set in a real biome undergoing a real crisis, each teaching a real family of restoration solutions.</p>
          <p style={{fontSize:16,lineHeight:1.65}}>Unlike existing "serious games," Verdant is built to game-industry standards first — the ecology is the constraint, not the decoration. Players fail, learn, and retry.</p>
        </div>
        <div style={{borderRadius:18,overflow:'hidden',aspectRatio:'4/3'}}>
          <img src={IMGS.desert} alt="Verdant" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        </div>
      </div>
    )},
    {id:'inv-3',n:'03',h:'Market size.',body:(
      <div className="vd-3col-grid">
        {[{v:'$340B',l:'Global EdTech TAM by 2025',s:'HolonIQ · 2024',c:'var(--ember-dk)'},
          {v:'$4B',l:'Corporate climate training spend/yr (U.S.)',s:'Brandon Hall · 2025',c:'var(--green-dk)'},
          {v:'$780M',l:'K-12 climate curriculum budget (U.S. + EU)',s:'NCSE / EIT Climate-KIC · 2025',c:'var(--green-dk)'},
        ].map((s,i)=>(
          <div key={i} style={{paddingTop:16,borderTop:`2px solid ${s.c}`}}>
            <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:52,color:s.c,letterSpacing:'-0.025em',marginBottom:8}}>{s.v}</div>
            <div style={{fontWeight:600,fontSize:15,marginBottom:6}}>{s.l}</div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:10.5,color:'var(--ink-3)',letterSpacing:'.06em'}}>{s.s}</div>
          </div>
        ))}
      </div>
    )},
    {id:'inv-4',n:'04',h:'Business model.',body:(
      <div className="vd-2col-grid">
        {[{t:'B2B Schools',p:'$12/student/yr',d:'Curriculum license · LMS integration · teacher dashboard · assessment rubrics',a:'Year 1 target: $180K ARR from 3 pilot districts'},
          {t:'B2B Enterprise',p:'$35/seat/yr',d:'ESG training module · completion tracking · certificate · API integration',a:'Year 2 target: $420K ARR from 4 enterprise clients'},
          {t:'B2G / Grants',p:'Milestone-based',d:'EU Climate-KIC, USAID, Gates Foundation — climate-literacy grant pool',a:'Year 1 target: $200K from two open grants'},
          {t:'Consumer',p:'Free forever',d:'The demo stays free. Individual players build reputation and feed B2B pipeline.',a:'No direct revenue — pure reputation and pipeline'},
        ].map((m,i)=>(
          <div key={i} style={{padding:24,border:'1px solid var(--line)',borderRadius:16}}>
            <div style={{fontFamily:'var(--font-mono)',fontSize:10,letterSpacing:'.14em',color:'var(--ink-3)',fontWeight:700,marginBottom:8,textTransform:'uppercase'}}>{m.t}</div>
            <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:28,color:'var(--ink)',marginBottom:8}}>{m.p}</div>
            <p style={{fontSize:13.5,marginBottom:12}}>{m.d}</p>
            <div style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--ember-dk)',fontWeight:600}}>{m.a}</div>
          </div>
        ))}
      </div>
    )},
    {id:'inv-5',n:'05',h:'Milestones.',body:(
      <div>
        {[{q:'Q2 2026 · NOW',items:['v0.5 demo live — 6 playable levels (starter + 5 biomes), browser, no login','Pilot agreement signed with 1 school district','Pre-seed raise open']},
          {q:'Q3 2026',items:['Teacher dashboard + LMS integration','Assessment rubric shipped','2 more pilot districts signed']},
          {q:'Q4 2026',items:['First enterprise ESG module live','v0.8: iOS PWA, offline mode, mobile layout','First grant ($100K) closed']},
          {q:'Q1 2027',items:['v1.0: full curriculum pack + teacher guide','First paid school contract ($12/student/yr)','$1.4M pre-seed fully deployed']},
        ].map((m,i)=>(
          <div key={i} className="vd-roadmap-row">
            <div style={{fontFamily:'var(--font-mono)',fontSize:11,fontWeight:700,letterSpacing:'.08em',color:i===0?'var(--ember-dk)':'var(--ink-3)'}}>{m.q}</div>
            <ul style={{margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:8}}>
              {m.items.map((item,j)=>(
                <li key={j} style={{display:'flex',gap:10,fontSize:15}}>
                  <span style={{color:'var(--green)',flexShrink:0}}>✓</span><span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )},
    {id:'inv-6',n:'06',h:'Team.',body:(
      <div className="vd-3col-grid">
        {[{name:'Stanley C. Okonkwo',role:'Founder · Engineering',bio:'MSc Ecology & Nature Management, RUDN Moscow. BSc Geological Sciences. Full-stack engineer (5 yrs), AWS certified. Two peer-reviewed publications in environmental science.',av:'SC'},
          {name:'Chizoba Nzeakor',role:'Co-founder · CEO',bio:'Climate Technology Solutions. Background in environmental policy and community organising across West Africa. Leads partnerships, school pilots, and fundraising.',av:'CN'},
          {name:'Advisory Board',role:'Ecologists & Educators',bio:'Dr. Adaeze Eboh (marine biology, Niger Delta), Dr. Sahel Almami (FMNR field ecology), Iris Lavoie (astrobiologist, educator — Planet B science lead).',av:'AB'},
        ].map((t,i)=>(
          <div key={i} className="vd-card">
            <div style={{width:46,height:46,borderRadius:'50%',background:'linear-gradient(135deg,var(--green),var(--ember))',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,marginBottom:16}}>{t.av}</div>
            <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{t.name}</div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:10.5,color:'var(--ember-dk)',fontWeight:700,letterSpacing:'.08em',marginBottom:12,textTransform:'uppercase'}}>{t.role}</div>
            <p style={{fontSize:13.5,lineHeight:1.6}}>{t.bio}</p>
          </div>
        ))}
      </div>
    )},
    {id:'inv-7',n:'07',h:'The ask.',body:(
      <div className="vd-2col-split">
        <div>
          <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:68,color:'var(--ember-dk)',letterSpacing:'-0.03em',lineHeight:.95,marginBottom:14}}>$1.4M</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:11,fontWeight:700,letterSpacing:'.12em',color:'var(--ink-3)',marginBottom:22,textTransform:'uppercase'}}>SAFE · 20% POST-MONEY CAP · PRE-SEED</div>
          <p style={{fontSize:16,lineHeight:1.7,marginBottom:14}}>We are raising $1.4M on a SAFE note with a $7M post-money valuation cap. Minimum check: $25K.</p>
          <p style={{fontSize:15,lineHeight:1.65,color:'var(--ink-3)'}}>Funds deployed over 18 months: 45% product, 30% sales, 15% science & curriculum, 10% ops.</p>
          <div style={{marginTop:26}}><a href="mailto:invest@verdant.game" className="vd-btn vd-btn-e" style={{textDecoration:'none',display:'inline-flex'}}>Reach out to invest →</a></div>
        </div>
        <div>
          {[['Product & engineering (45%)','$630K','v1.0 features, mobile PWA, LMS integration'],['Sales & school pilots (30%)','$420K','3 paid pilot districts, 2 enterprise clients'],['Science & curriculum (15%)','$210K','Peer review, teacher guide, assessment rubric'],['Operations (10%)','$140K','Legal, audit, server costs, 18 months runway']].map(([n,v,d],i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,paddingBottom:16,marginBottom:16,borderBottom:'1px solid var(--line)'}}>
              <div><div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{n}</div><div style={{fontSize:12.5,color:'var(--ink-3)'}}>{d}</div></div>
              <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:20,color:'var(--ember-dk)',flexShrink:0}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    )},
  ];

  return (
    <>
      <section className="vd-ph" style={{paddingBottom:0}}>
        <div className="vd-con">
          <div className="vd-ey vd-rv"><span className="dot"/> FOR INVESTORS · PRE-SEED · Q2 2026</div>
          <h1 className="vd-rv" style={{maxWidth:860}}>The first ecological simulation built like a real game and grounded like real science.</h1>
          <p className="vd-rv" style={{fontSize:19,lineHeight:1.6,maxWidth:640,marginTop:20,color:'var(--ink-2)'}}>We're raising $1.4M to take Verdant from playable demo (live now) to a classroom-ready curriculum and ESG-training product by Q1 2027.</p>
          <div className="vd-qs-g vd-rv" style={{marginTop:44}}>
            {[{l:'RAISING',v:'$1.4M',s:'SAFE, 20% post-money cap · pre-seed',hero:true},{l:'STAGE',v:'v0.6',s:'6 playable levels · browser demo'},{l:'RUNWAY',v:'18 mo',s:'to v1.0 + first school contracts'},{l:'TAM',v:'$340B',s:'global edtech by 2025 (HolonIQ)'}].map((s,i)=>(
              <div key={i} className={`vd-qs${s.hero?' hero':''}`}>
                <div className="vd-qs-l">{s.l}</div>
                <div className="vd-qs-v">{s.v}</div>
                <div className="vd-qs-s">{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <nav className="vd-itoc">
        <div className="vd-itoc-in">
          {['01 Problem','02 Solution','03 Market','04 Model','05 Milestones','06 Team','07 The ask'].map((s,i)=>(
            <a key={i} href={`#inv-${i+1}`}>{s}</a>
          ))}
        </div>
      </nav>

      <div className="vd-con">
        {BLOCKS.map((b,i)=>(
          <div key={b.id} id={b.id} className="vd-ib vd-rv">
            <div className="vd-ib-h">
              <div className="vd-ib-n">{b.n}</div>
              <div><h2 style={{marginBottom:28}}>{b.h}</h2>{b.body}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export function LandingPage({ onPlay, onSelectLevel, onOpenAuth, onOpenProfile }) {
  useCSS();
  useReveal();
  const play = id => (onSelectLevel || onPlay)(id);
  const [page, setPage] = useState('home');
  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  const PAGE = { home: Home, product: Product, impact: Impact, investors: Investors }[page] || Home;

  return (
    <div className="vd">
      <Nav page={page} setPage={setPage} onPlay={play} onOpenAuth={onOpenAuth} onOpenProfile={onOpenProfile}/>
      <PAGE onPlay={play} setPage={setPage}/>
      <Footer setPage={setPage} onPlay={play}/>
    </div>
  );
}