"use client";

import SectionHeader from "./SectionHeader";

const EP = { fontFamily: "var(--font-epilogue), sans-serif" } as const;
const MONO = { fontFamily: "var(--font-space-mono), monospace" } as const;

const MANIFESTO_BLOCKS = [
  { text: "casa tomada\nno es una fiesta,\nno es ni desconexión,\nni relax,\nni entretenimiento", emphasis: false },
  { text: "casa tomada es\nla posibilidad de vivir una\nficción más adecuada,\nmás placentera.", emphasis: false },
  { text: "una ficción en la que podamos encontrarnos\nsiendo parte de esta carne latente y vibrante,\nmultiplicidad que se contagia\ncuando dejamos que el sonido\nnos parta al medio\npara dejar de ser lo que éramos", emphasis: false },
  { text: "tomar la casa es recuperar\nun territorio normalizado, homogéneo,\nexpropiado por el\nfascismo corporativo y\nsu máscara,\nel estado nación", emphasis: false },
  { text: "creemos que\nhoy más que nunca\ndebemos devolverle lo\nque fue en sus inicios:", emphasis: false },
  { text: "liberación,\nresistencia,\ndiversidad,\nexperimentación,\ncomunidad.", emphasis: true },
  { text: "pero un sueño\nviejo y lejano\nno nos basta,\nno cuestionamos para\nregresar a un pasado\nmejor. sino para darnos\nla posibilidad de\nimaginar juntxs\nun mundo en el que\nconvivan", emphasis: false },
  { text: "la fiesta y la reflexion\nel placer y la bronca\nel baile y la psicodelia\nla manija y el cuidado", emphasis: true },
  { text: "tomar la casa es un hacer\nque requiere poner el cuerpo\na experimentar nuevos movimientos,\npara asi poder pensar diferente.", emphasis: false },
  { text: "requiere esquivar la anestesia\nde las pantallas\npara mirarnos a los ojos\ny darnos cuenta de que\nsolo estando juntxs\npodemos enfrentar aquello\nque nos oprime", emphasis: false },
  { text: "porque si\ntodxs\nestamos\nrotxs que\nmejor que\nestar unidxs\ny organizadxs", emphasis: true },
  { text: "para la casa tomada:\nla salida es colectiva,\nla contracultura\nse construye,\nla paz nunca fue la solución,\nel baile y la música\nsiempre fueron espacios de resistencia", emphasis: false },
];

export default function ManifiestaSection({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#080000",
        position: "relative",
      }}
    >
      <SectionHeader onBack={onBack} />

      {/* Tiled reflected background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-20%",
            backgroundImage: "url('/manifiesta/M01.jpg')",
            backgroundSize: "50% auto",
            backgroundRepeat: "repeat",
            opacity: 0.35,
            filter: "saturate(0.6)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,0,0,0.5) 0%, rgba(8,0,0,0.3) 50%, rgba(8,0,0,0.5) 100%)" }} />
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, padding: "100px 24px 80px", maxWidth: 600, margin: "0 auto" }}>

        {/* _maniest@ heading */}
        <h1
          style={{
            ...MONO,
            fontWeight: 700,
            fontSize: "clamp(60px, 18vw, 135px)",
            letterSpacing: "-0.05em",
            color: "rgba(200,200,200,0.85)",
            lineHeight: 0.9,
            marginBottom: "8vh",
            wordBreak: "break-all",
          }}
        >
          _maniest@
        </h1>

        {/* Manifesto blocks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8vh" }}>
          {MANIFESTO_BLOCKS.map((block, i) => (
            <p
              key={i}
              style={{
                ...EP,
                fontWeight: block.emphasis ? 800 : 500,
                fontSize: block.emphasis
                  ? "clamp(28px, 8vw, 68px)"
                  : "clamp(20px, 5.5vw, 50px)",
                letterSpacing: "-0.05em",
                color: block.emphasis ? "rgba(210,210,210,0.9)" : "rgba(170,170,170,0.75)",
                lineHeight: 1.15,
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {block.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
