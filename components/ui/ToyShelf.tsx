import Head from "next/head";

export default function ToyShop() {
  return (
    <>
      <Head>
        <title>Magical Toy Shop – Mockup</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <header>
        <div className="ribbon"><span>Toy Shop</span></div>
      </header>

      <main className="container">
        {/* First shelf */}
        <section className="shelf">
          <div className="row">
            <article className="card">
              <div className="thumb">
                <img src="https://via.placeholder.com/150x120?text=Nerf" alt="Nerf" />
              </div>
              <div className="label">Nerf</div>
              <strong className="price">$39.99</strong>
            </article>

            <article className="card">
              <div className="thumb">
                <img src="https://via.placeholder.com/150x120?text=Minnie" alt="Minnie" />
              </div>
              <div className="label">Minnie Kitchen</div>
              <strong className="price">$59.99</strong>
            </article>

            <article className="card">
              <div className="thumb">
                <img src="https://via.placeholder.com/150x120?text=Drone" alt="Drone" />
              </div>
              <div className="label">Drone</div>
              <strong className="price">$79.99</strong>
            </article>

            <article className="card">
              <div className="thumb">
                <img src="https://via.placeholder.com/150x120?text=RC+Truck" alt="RC Truck" />
              </div>
              <div className="label">RC Truck</div>
              <strong className="price">$49.99</strong>
            </article>

            <article className="card">
              <div className="thumb">
                <img src="https://via.placeholder.com/150x120?text=Bubble" alt="Bubble" />
              </div>
              <div className="label">Bubble Machine</div>
              <strong className="price">$24.99</strong>
            </article>
          </div>

          <div className="shelf-board" />

          <div className="garland" aria-hidden>
            <div className="bulb" style={{ ['--delay' as any]: '.0s' } as React.CSSProperties} />
            <div className="bulb" style={{ ['--delay' as any]: '.1s' } as React.CSSProperties} />
            <div className="bulb" style={{ ['--delay' as any]: '.2s' } as React.CSSProperties} />
            <div className="bulb" style={{ ['--delay' as any]: '.3s' } as React.CSSProperties} />
            <div className="bulb" style={{ ['--delay' as any]: '.4s' } as React.CSSProperties} />
            <div className="bulb" style={{ ['--delay' as any]: '.5s' } as React.CSSProperties} />
            <div className="bulb" style={{ ['--delay' as any]: '.6s' } as React.CSSProperties} />
            <div className="bulb" style={{ ['--delay' as any]: '.7s' } as React.CSSProperties} />
          </div>
        </section>

      
      </main>

      {/* Styles */}
      <style jsx global>{`
        :root{
          --red:#d41414; --red-dark:#9a0e0e; --gold:#ffd75a; --green:#1ea94b; --blue:#19a2ff; --bg:#68d1ff;
          --wood:#a87953; --wood-dark:#7b553b; --snow:#ffffff;
        }
        *{box-sizing:border-box}
        html, body, #__next { height: 100%; }
        body{margin:0; font-family:'Nunito',sans-serif; background: linear-gradient(#7ad7ff 0%, #5cc6ff 40%, #bfeaff 100%); min-height:100vh; overflow-x:hidden;}

        header{position:relative; padding-top:40px; text-align:center}
        .ribbon{display:inline-block; position:relative; color:#fff; font-family:'Fredoka One', cursive; font-size: clamp(32px, 6vw, 64px); letter-spacing:2px; text-transform:uppercase;}
        .ribbon span{position:relative; display:inline-block; padding:22px 46px 28px; background:linear-gradient(180deg, #ff2f2f, #b80000); border-radius:8px; box-shadow: 0 18px 30px rgba(0,0,0,.25);}

        .container{max-width:1100px; margin:40px auto; padding:0 20px 80px; display:flex; flex-direction:column; gap:120px;}

        .shelf{position:relative; width:100%; padding-bottom:72px;}
        .row{display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:nowrap; gap:20px;}
        .card{position:relative; width:160px; text-align:center;}
        .thumb{height:120px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.95); border-radius:16px; box-shadow:0 8px 16px rgba(0,0,0,.15);}
        .card::after{content:""; position:absolute; bottom:-12px; left:25%; right:25%; height:10px; background:radial-gradient(ellipse at center, rgba(0,0,0,.25), rgba(0,0,0,0) 70%); border-radius:50%;}
        .label{margin-top:10px; display:inline-block; padding:8px 12px; font-weight:700; color:#2b1b12; background:#d9c4b7; border-radius:999px;}
        .price{display:block; font-weight:900; color:#0d5c2a; margin-top:6px}

        .shelf-board{position:absolute; left:12px; right:12px; bottom:32px; height:28px; border-radius:20px; background: linear-gradient(180deg, var(--wood) 0%, var(--wood-dark) 100%); box-shadow: 0 12px 18px rgba(58,36,22,.35), inset 0 3px 0 rgba(255,255,255,.35)}
        .shelf-board::after{content:""; position:absolute; left:14px; right:14px; bottom:-10px; height:16px; border-radius:20px; background: linear-gradient(180deg, #6b452f, #5d3a26); box-shadow: 0 8px 18px rgba(0,0,0,.25)}

        .garland{position:absolute; left:0; right:0; bottom:0; height:56px; display:flex; justify-content:space-evenly; align-items:flex-start; pointer-events:none}
        .bulb{--delay:0s; width:12px; height:20px; border-radius:50% 50% 60% 60% / 40% 40% 70% 70%; background:var(--gold); box-shadow:0 6px 10px rgba(0,0,0,.18); transform-origin:top center; animation: sway 2.6s ease-in-out infinite, blink 1.4s linear infinite; animation-delay:0s, var(--delay)}
        .bulb:nth-child(3n){background:var(--red)}
        .bulb:nth-child(3n+1){background:var(--blue)}
        .bulb:nth-child(3n+2){background:var(--green)}
        @keyframes sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(3deg)}}
        @keyframes blink{0%{filter:brightness(.4);opacity:.6}50%{filter:brightness(1.3);opacity:1;box-shadow:0 0 10px currentColor,0 0 20px currentColor}100%{filter:brightness(.6);opacity:.8}}
      `}</style>
    </>
  );
}
